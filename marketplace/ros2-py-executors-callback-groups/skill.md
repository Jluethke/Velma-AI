# ROS 2 Python Executors and Callback Groups

**One-line description:** Chooses an rclpy executor and callback groups by explicit rules, replaces synchronous `client.call()` inside callbacks with `call_async` or a correctly grouped call, and proves the node no longer hangs.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_node_source` (object, required): Node module from `ros2-py-rclpy-node`.

---

## Outputs

- `py_executor_design` (object): Executor type and a table of every callback with its group.
- `py_deadlock_check` (object): Before and after evidence for each blocking call.

---

## Phase 1: Inventory Callbacks

### Entry Criteria
- The node runs.

### Actions
1. `grep -n "create_subscription\|create_timer\|create_service\|create_client\|\.call(\|spin_until_future_complete" <module>`.
2. For each callback record what it touches and whether it blocks.
3. Know the defaults: `rclpy.spin(node)` uses a SingleThreadedExecutor; callbacks without a group use the node's default MutuallyExclusiveCallbackGroup.
4. Know the limit: Python threads share the GIL. A MultiThreadedExecutor lets a callback run while another waits on I/O, but does not speed up CPU-bound Python work.

### Output
Callback inventory.

### Quality Gate
- Every grep match has a row.

---

## Phase 2: Choose and Apply

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Apply in order:

| Condition | Decision |
|---|---|
| A callback calls `client.call(req)` | Preferred: replace with `future = self.client.call_async(req)` and `future.add_done_callback(self.on_response)`. Alternative: make the callback `async def` and `await self.client.call_async(req)`. Second alternative: put the client in a `MutuallyExclusiveCallbackGroup` separate from the calling callback and run a `MultiThreadedExecutor`. |
| A callback calls `rclpy.spin_until_future_complete` | Remove it; it cannot be used on a node already spinning. Use the row above. |
| A slow I/O callback delays a periodic one | Separate MutuallyExclusive groups and a MultiThreadedExecutor. |
| None | Keep SingleThreadedExecutor. |

2. Imports: `from rclpy.callback_groups import MutuallyExclusiveCallbackGroup, ReentrantCallbackGroup` and `from rclpy.executors import MultiThreadedExecutor`.
3. Pass the group: `self.create_client(Srv, 'name', callback_group=self.client_group)`; same keyword on `create_timer` and `create_subscription`.
4. Main with a multithreaded executor:
   ```
   executor = MultiThreadedExecutor()
   executor.add_node(node)
   executor.spin()
   ```
5. Guard attributes shared across groups with `threading.Lock`.

### Output
`py_executor_design`.

### Quality Gate
- `grep -n "\.call(" <module>` returns no line inside a callback, or each remaining one is in a separate group under a MultiThreadedExecutor and recorded.

---

## Phase 3: Prove

### Entry Criteria
- Changes applied and the package rebuilt.

### Actions
1. Start the service server and the node.
2. Before the change the log stopped after `sending request`; after the change the log must show the response line.
3. Confirm periodic callbacks keep their rate during the service call with `ros2 topic hz <periodic output>`.
4. Run `colcon test --packages-select <pkg>` and `colcon test-result --verbose`.

### Output
`py_deadlock_check`.

### Quality Gate
- The response log line appears.
- `ros2 topic hz` shows the periodic output continuing during the call.
- Tests report 0 errors and 0 failures.

---

## Worked Example

Illustrative only. A timer calls `/reset_odom` with `self.cli.call(req)` and the node froze.

- Phase 2: replaced with `call_async` plus `add_done_callback`.
- Phase 3: log shows `reset accepted`; `ros2 topic hz /odom_filtered` stays at its rate.

---

## Exit Criteria

DONE when no callback blocks its own executor, each callback has a recorded group, and the node responds and keeps its periodic rate.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Blocking happens in a third-party library call | **Adjust**: move it to its own MutuallyExclusive group under a MultiThreadedExecutor. |
| Phase 3 | Done callback never fires | **Adjust**: confirm the server is running with `ros2 service list` and the node is spinning. |
| Phase 3 | Rate still drops during CPU-heavy work | **Return**: GIL limit; move the computation to C++ or a separate process. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
