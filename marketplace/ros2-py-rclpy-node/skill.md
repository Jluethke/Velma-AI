# ROS 2 rclpy Node in Python

**One-line description:** Writes one rclpy node class with its publishers, subscriptions and timers, registers it as a console script in an ament_python package, and proves it runs and shuts down cleanly with the ros2 CLI and the package tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workspace_dir` (string, required): Workspace root.
- `node_spec` (object, required): Node name, package, every topic with message type, rate where periodic, and the processing it performs.
- `interface_package` (string, required): Package holding custom types, or `none`.

---

## Outputs

- `py_node_source` (object): Path of the module, the `entry_points` line, and the executable name.
- `py_test_result` (object): `colcon test-result --verbose` summary and the `ros2 node info` output for the running node.

---

## Phase 1: Write the Node Module

### Entry Criteria
- The package exists with build type `ament_python`.
- `node_spec` names every topic with a type.

### Actions
1. Create `<pkg>/<pkg>/<node_name>.py` with one class deriving from `rclpy.node.Node` and calling `super().__init__('<node_name>')`.
2. Publishers: `self.pub = self.create_publisher(Range, 'range', 10)`. Subscriptions: `self.sub = self.create_subscription(Range, 'range_raw', self.on_range, 10)`. Store each on `self`; an unreferenced subscription is garbage collected and stops receiving.
3. Timers: `self.timer = self.create_timer(period_s, self.on_timer)` with `period_s = 1.0 / rate_hz` from `node_spec`.
4. Log with `self.get_logger().info(...)`, never `print`.
5. Write `main`:
   ```
   def main(args=None):
       rclpy.init(args=args)
       node = RangeFilter()
       try:
           rclpy.spin(node)
       except (KeyboardInterrupt, ExternalShutdownException):
           pass
       finally:
           node.destroy_node()
           if rclpy.ok():
               rclpy.shutdown()
   ```
   Import `ExternalShutdownException` from `rclpy.executors`.
6. Do not do blocking work (for example `time.sleep` or a synchronous service `call()`) inside a callback; it stalls every other callback in a single-threaded executor.

### Output
One node module.

### Quality Gate
- `python3 -m py_compile <pkg>/<pkg>/<node_name>.py` exits 0.
- `grep -n "print(" <pkg>/<pkg>/<node_name>.py` returns nothing.

---

## Phase 2: Register and Build

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. In `setup.py`, add to `entry_points={'console_scripts': [...]}` the line `'<exe> = <pkg>.<node_name>:main'`.
2. Confirm `setup.cfg` contains:
   ```
   [develop]
   script_dir=$base/lib/<pkg>
   [install]
   install_scripts=$base/lib/<pkg>
   ```
   Without these `ros2 run` reports `No executable found`.
3. Confirm `resource/<pkg>` exists (an empty marker file) and `data_files` in `setup.py` installs it to `share/ament_index/resource_index/packages`.
4. Add `<exec_depend>` lines in `package.xml` for `rclpy`, each message package, and `interface_package` when not `none`.
5. Build: `colcon build --symlink-install --packages-select <pkg>`. With `--symlink-install`, Python edits take effect without rebuild, but changes to `setup.py` or new files still need a rebuild.

### Output
An installed console script.

### Quality Gate
- `ros2 pkg executables <pkg>` lists `<exe>` after sourcing `install/setup.bash`.

---

## Phase 3: Run, Observe and Test

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Terminal A: `ros2 run <pkg> <exe>`.
2. Terminal B: `ros2 node info /<node_name>` and compare to `node_spec`.
3. `ros2 topic hz <topic>` for each periodic output; feed inputs with `ros2 topic pub --once <topic> <type> "<yaml>"`.
4. Press Ctrl+C in Terminal A. It must exit without a traceback.
5. Run `colcon test --packages-select <pkg>` then `colcon test-result --verbose`. The default template runs `ament_copyright`, `ament_flake8` and `ament_pep257`. Fix reported lines; do not delete these test files.

### Output
`py_node_source`, `py_test_result`.

### Quality Gate
- `ros2 node info` lists exactly the topics in `node_spec`.
- Ctrl+C produces no traceback.
- `colcon test-result --verbose` shows 0 errors and 0 failures.

---

## Worked Example

Illustrative only. Same `range_filter` spec as the C++ flow, package `range_tools`.

- Phase 1: `RangeFilter(Node)` with `self.sub` and `self.pub`.
- Phase 2: `'range_filter = range_tools.range_filter:main'`; `ros2 pkg executables range_tools` prints `range_tools range_filter`.
- Phase 3: `ros2 topic pub --once /range_raw sensor_msgs/msg/Range "{range: 1.2}"` makes the node log `filtered range 1.20`; tests report `Summary: 3 tests, 0 errors, 0 failures, 0 skipped`.

---

## Exit Criteria

DONE when the node runs, matches `node_spec` in the graph, exits cleanly on Ctrl+C, and package tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Callback needs a blocking service call | **Adjust**: use `call_async` with a done callback, or follow `ros2-py-executors-callback-groups`. |
| Phase 2 | `No executable found` | **Adjust**: fix `setup.cfg` and `entry_points`, rebuild, open a new terminal. |
| Phase 2 | `ModuleNotFoundError` for the package | **Adjust**: confirm `packages=[package_name]` in `setup.py` and an `__init__.py` in `<pkg>/<pkg>/`. |
| Phase 3 | Traceback on Ctrl+C | **Adjust**: apply the `main` pattern from Phase 1 step 5. |
| Phase 3 | flake8 failures | **Adjust**: fix the reported lines; rerun tests. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
