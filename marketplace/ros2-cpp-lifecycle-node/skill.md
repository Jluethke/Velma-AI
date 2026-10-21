# ROS 2 C++ Lifecycle (Managed) Node

**One-line description:** Converts an rclcpp node into an rclcpp_lifecycle::LifecycleNode with resources split across on_configure, on_activate, on_deactivate, on_cleanup and on_shutdown, and proves every transition and the inactive-publisher behavior with the `ros2 lifecycle` CLI.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cpp_node_source` (object, required): Node source from `ros2-cpp-rclcpp-node`.
- `node_spec` (object, required): Which resources the node owns (device handles, publishers, timers) and what must happen when it is deactivated.

---

## Outputs

- `cpp_lifecycle_node` (object): Source path, the resource-to-callback assignment table, and the executable name.
- `cpp_lifecycle_log` (object): `ros2 lifecycle get`, `set` and `list` transcripts for the full transition sequence.

---

## Phase 1: Assign Resources to Transitions

### Entry Criteria
- `node_spec` lists the node's resources.

### Actions
1. Use the managed node state machine from the ROS 2 design article "Managed nodes": primary states Unconfigured, Inactive, Active, Finalized; transitions configure, activate, deactivate, cleanup, shutdown.
2. Fill this table for every resource:

| Callback | Does |
|---|---|
| `on_configure` | Read parameters, create publishers, subscriptions, timers (timers can be created here and started on activate), open devices. |
| `on_activate` | Activate lifecycle publishers, start timers, begin processing. |
| `on_deactivate` | Stop timers, deactivate publishers. Leave devices open. |
| `on_cleanup` | Release everything created in `on_configure`, so configure can run again. |
| `on_shutdown` | Release everything, from any state. |
| `on_error` | Release what is safe to release; return SUCCESS to go to Unconfigured, FAILURE to go to Finalized. |

3. The constructor does nothing except declare parameters.

### Output
Resource-to-callback table.

### Quality Gate
- Every resource from `node_spec` appears in exactly one create row and one release row.

---

## Phase 2: Implement

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Derive from `rclcpp_lifecycle::LifecycleNode`. Callbacks have the form `CallbackReturn on_configure(const rclcpp_lifecycle::State &) override` where `using CallbackReturn = rclcpp_lifecycle::node_interfaces::LifecycleNodeInterface::CallbackReturn;`, returning `CallbackReturn::SUCCESS`, `FAILURE` or `ERROR`.
2. Publishers: `pub_ = create_publisher<Msg>("topic", qos);` gives an `rclcpp_lifecycle::LifecyclePublisher`. In `on_activate` call `pub_->on_activate();` and in `on_deactivate` call `pub_->on_deactivate();`. Also call the base `LifecycleNode::on_activate(state)` where your distro's examples do; check the `lifecycle_talker` demo in `demos/lifecycle` for your distro.
3. A publish on an inactive lifecycle publisher is dropped with a log message stating the publisher is not activated; this is expected.
4. In `main`, spin the node's base interface: `rclcpp::spin(node->get_node_base_interface());`.
5. CMake: `find_package(rclcpp_lifecycle REQUIRED)` and link `rclcpp_lifecycle::rclcpp_lifecycle`; add `<depend>rclcpp_lifecycle</depend>`.

### Output
Built lifecycle node.

### Quality Gate
- Build summary shows zero failed packages.
- Every callback returns a `CallbackReturn` value on every path.

---

## Phase 3: Drive the Transitions

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Start the node. `ros2 lifecycle nodes` lists it. `ros2 lifecycle get /<node>` prints `unconfigured [1]`.
2. `ros2 lifecycle list /<node>` prints the transitions available from the current state.
3. `ros2 lifecycle set /<node> configure` then `get` prints `inactive [2]`. `ros2 topic hz <topic>` prints nothing.
4. `ros2 lifecycle set /<node> activate` then `get` prints `active [3]`; `ros2 topic hz` now prints a rate.
5. `deactivate`, then `cleanup`, then `configure` again: each must print `Transitioning successful`. A second configure that fails means `on_cleanup` did not release something.
6. `ros2 lifecycle set /<node> shutdown` then `get` prints `finalized [4]`.
7. For orchestrated bringup use `launch_ros.actions.LifecycleNode` with `launch_ros.events.lifecycle.ChangeState` events, or a lifecycle manager node; record which.

### Output
`cpp_lifecycle_node`, `cpp_lifecycle_log`.

### Quality Gate
- Every step 1 to 6 output is recorded and matches the expected state id.
- Data is published only while the state is active.

---

## Worked Example

Illustrative only. A lidar driver node.

- Phase 1: serial port opened in `on_configure`, closed in `on_cleanup`; scan timer started in `on_activate`.
- Phase 3: `ros2 lifecycle get /lidar_driver` prints `inactive [2]` after configure; `ros2 topic hz /scan` is silent until activate, then prints `average rate: 10.001`.

---

## Exit Criteria

DONE when every transition succeeds in sequence including a reconfigure after cleanup, and publishing happens only in the active state.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Publisher never publishes after activate | **Adjust**: call `pub_->on_activate()` in `on_activate`. |
| Phase 3 | `ros2 lifecycle nodes` does not list the node | **Adjust**: confirm the class derives from `LifecycleNode`, not `Node`. |
| Phase 3 | Second configure fails | **Adjust**: release the leftover resource in `on_cleanup`. |
| Phase 3 | Transition hangs | **Retry**: check for a blocking call in the callback; move it out and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
