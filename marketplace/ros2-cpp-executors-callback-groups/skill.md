# ROS 2 C++ Executors and Callback Groups

**One-line description:** Chooses an rclcpp executor and assigns every callback to a MutuallyExclusive or Reentrant callback group from explicit rules, removes the classic synchronous-service-call-in-callback deadlock, and proves concurrency and absence of data races with logs and ThreadSanitizer.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cpp_node_source` (object, required): Node source from `ros2-cpp-rclcpp-node`.

---

## Outputs

- `cpp_executor_design` (object): Executor type, thread count, and a table of every callback with its group and the shared state it touches.
- `cpp_deadlock_check` (object): Before and after evidence for any blocking call, plus the ThreadSanitizer run result.

---

## Phase 1: Inventory Callbacks

### Entry Criteria
- The node builds.

### Actions
1. List every subscription, timer, service server, client response and action callback: `grep -n "create_subscription\|create_wall_timer\|create_timer\|create_service\|create_client" src/*.cpp`.
2. For each callback record: expected duration (measure with timestamps if unknown), the members it reads or writes, and any blocking call (for example `future.get()`, `spin_until_future_complete`, `std::this_thread::sleep_for`, device I/O).
3. Know the default: every callback without an explicit group goes in the node's default callback group, which is MutuallyExclusive. With `rclcpp::spin(node)` the executor is a SingleThreadedExecutor.

### Output
Callback inventory.

### Quality Gate
- Every callback found by the grep has a row.

---

## Phase 2: Choose Executor and Groups

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Apply these rules in order:

| Condition | Decision |
|---|---|
| A callback waits on a service response or action result | Put the client in its own MutuallyExclusive group, use a `MultiThreadedExecutor`, and wait with `future.wait_for(...)` on that thread. Better: use `async_send_request(request, response_callback)` and do not wait at all. |
| A long callback must not delay a short periodic one | Separate MutuallyExclusive groups for each, MultiThreadedExecutor. |
| One callback may safely run concurrently with itself (no shared mutable state, or state guarded) | Reentrant group. |
| None of the above | Keep SingleThreadedExecutor and the default group. |

2. Never call `rclcpp::spin_until_future_complete(node, future)` inside a callback of a node that is already spinning; it deadlocks or throws because the node is already added to an executor.
3. Create groups: `cb_group_ = create_callback_group(rclcpp::CallbackGroupType::MutuallyExclusive);` then pass `rclcpp::SubscriptionOptions opts; opts.callback_group = cb_group_;` to `create_subscription`, or as the last argument to `create_wall_timer` and `create_client`.
4. Executor in `main`: `rclcpp::executors::MultiThreadedExecutor exec; exec.add_node(node); exec.spin();`. The thread count default comes from hardware concurrency; set it only if `node_spec` gives a reason.
5. Guard every member written in one group and read in another with `std::mutex` or `std::atomic`.
6. Newer distros add an events executor (`rclcpp::experimental::executors::EventsExecutor`, experimental). Use it only with a measured reason and check its availability for your distro.

### Output
`cpp_executor_design`.

### Quality Gate
- Every callback has a group in the table.
- Every member shared across groups has a named guard.

---

## Phase 3: Prove

### Entry Criteria
- Phase 2 changes are built.

### Actions
1. Log the thread id in each callback at debug level (`std::this_thread::get_id()`); run and confirm callbacks in different groups run on different threads when overlapping.
2. If a blocking call existed: before the change, record the hang (no log after the request). After, record the response log.
3. Build with ThreadSanitizer: `colcon build --packages-select <pkg> --cmake-args -DCMAKE_CXX_FLAGS="-fsanitize=thread -g" -DCMAKE_EXE_LINKER_FLAGS="-fsanitize=thread"` in a separate build directory (`--build-base build_tsan --install-base install_tsan`).
4. Run the node from `install_tsan` under the same load; any `WARNING: ThreadSanitizer: data race` report is a defect to fix, not to suppress.

### Output
`cpp_deadlock_check`.

### Quality Gate
- The previously hanging path logs a response.
- The TSan run prints zero `data race` reports.

---

## Worked Example

Illustrative only. A timer callback calls a `/get_map` service and waited with `future.get()`; the node froze.

- Phase 2: client moved to its own MutuallyExclusive group, executor changed to MultiThreadedExecutor, `future.get()` replaced with `async_send_request` plus response callback.
- Phase 3: log shows `map received` within the run; TSan run prints no data race.

---

## Exit Criteria

DONE when every callback has a justified group, no callback blocks the executor it runs on, and ThreadSanitizer reports no data race.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Callback duration unknown | **Adjust**: measure with `get_clock()->now()` at entry and exit over a run. |
| Phase 3 | TSan reports a race | **Adjust**: guard the member named in the report; rerun. |
| Phase 3 | TSan aborts at startup in middleware code | **Return**: record it; run the race test on the node's own logic with a unit test instead. |
| Phase 3 | Still hangs | **Retry**: confirm the client really uses the new group; print `cb_group_` pointer at creation. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
