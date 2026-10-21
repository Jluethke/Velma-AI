# ROS 2 Python Lifecycle (Managed) Node

**One-line description:** Converts an rclpy node into an rclpy.lifecycle node with resources split across on_configure, on_activate, on_deactivate, on_cleanup and on_shutdown, and proves every transition with the `ros2 lifecycle` CLI.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_node_source` (object, required): Node module from `ros2-py-rclpy-node`.
- `node_spec` (object, required): Resources the node owns and the behavior required when deactivated.

---

## Outputs

- `py_lifecycle_node` (object): Module path, resource-to-callback table, executable name.
- `py_lifecycle_log` (object): `ros2 lifecycle` transcripts for the full transition sequence.

---

## Phase 1: Confirm Support and Assign Resources

### Entry Criteria
- `ros_distro` is Humble or newer. The `rclpy.lifecycle` module is available from Humble; confirm with `python3 -c "import rclpy.lifecycle"`.

### Actions
1. Run the import check above. If it fails, stop and use the C++ flow.
2. Fill the same table as the C++ flow: create in `on_configure`, start in `on_activate`, stop in `on_deactivate`, release in `on_cleanup` and `on_shutdown`.

### Output
Resource-to-callback table.

### Quality Gate
- The import check exits 0.
- Every resource has one create row and one release row.

---

## Phase 2: Implement

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Imports: `from rclpy.lifecycle import Node as LifecycleNode, State, TransitionCallbackReturn`. Check the exact exported names with `python3 -c "import rclpy.lifecycle as l; print(dir(l))"`.
2. Derive the class from `LifecycleNode`. Each callback has the form `def on_configure(self, state: State) -> TransitionCallbackReturn:` and returns `TransitionCallbackReturn.SUCCESS`, `FAILURE` or `ERROR`.
3. In `on_configure`: `self.pub = self.create_lifecycle_publisher(Range, 'range', 10)` and create the timer. Lifecycle publishers are activated by the base class when you return from `on_activate` after calling `super().on_activate(state)`; confirm against the rclpy lifecycle demo for your distro.
4. In `on_cleanup` and `on_shutdown`: `self.destroy_timer(self.timer)` and `self.destroy_lifecycle_publisher(self.pub)` (check method names with `dir(self)`), and close devices.
5. Never leave a callback without a return value; `None` is treated as an error.

### Output
Lifecycle node module.

### Quality Gate
- `python3 -m py_compile` on the module exits 0.
- `grep -c "return TransitionCallbackReturn" <module>` is at least the number of callbacks implemented.

---

## Phase 3: Drive the Transitions

### Entry Criteria
- The package is rebuilt and sourced.

### Actions
1. Start the node; `ros2 lifecycle get /<node>` prints `unconfigured [1]`.
2. `ros2 lifecycle set /<node> configure`; `get` prints `inactive [2]`; `ros2 topic hz` silent.
3. `activate`; `active [3]`; `ros2 topic hz` prints a rate.
4. `deactivate`, `cleanup`, `configure`: each prints `Transitioning successful`.
5. `shutdown`; `get` prints `finalized [4]`.
6. Run `colcon test --packages-select <pkg>` and `colcon test-result --verbose`.

### Output
`py_lifecycle_node`, `py_lifecycle_log`.

### Quality Gate
- Every transition output is recorded and matches the expected state id.
- `colcon test-result --verbose` shows 0 errors and 0 failures.

---

## Worked Example

Illustrative only. Python `range_filter` as a lifecycle node.

- Phase 3: after configure, `ros2 lifecycle get /range_filter` prints `inactive [2]` and `/range` is silent; after activate `ros2 topic hz /range` prints `average rate: 20.0`.

---

## Exit Criteria

DONE when every transition succeeds in sequence including reconfigure after cleanup, publishing occurs only while active, and tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `import rclpy.lifecycle` fails | **Stop**: use `ros2-cpp-lifecycle-node` or upgrade the distro. |
| Phase 2 | Name not found in `rclpy.lifecycle` | **Adjust**: use the names printed by `dir()`; do not invent them. |
| Phase 3 | Topic silent while active | **Adjust**: call `super().on_activate(state)` in `on_activate`. |
| Phase 3 | Second configure fails | **Adjust**: destroy the leftover entity in `on_cleanup`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
