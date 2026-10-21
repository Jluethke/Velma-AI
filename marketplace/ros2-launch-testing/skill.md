# ROS 2 Integration Tests With launch_testing

**One-line description:** Writes a launch_testing integration test that starts the real nodes from a launch description, asserts on their output and topics while running, checks exit codes after shutdown, and registers it so `colcon test` runs it for both ament_cmake and ament_python packages.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `launch_file` (string, required): Launch file from `ros2-py-launch-file`.
- `workspace_dir` (string, required): Workspace root.
- `stack` (string, required): `cpp` (ament_cmake package) or `python` (ament_python package).

---

## Outputs

- `launch_test_file` (string): Path of the test, for example `test/test_bringup.launch.py`.
- `launch_test_result` (object): `colcon test-result --verbose` output and the per-test pass or fail list.

---

## Phase 1: Write the Test

### Entry Criteria
- `launch_file` starts the system successfully.

### Actions
1. Create `test/test_bringup.launch.py`:
   ```
   import unittest
   import launch
   import launch_ros.actions
   import launch_testing.actions
   import launch_testing.asserts
   import pytest
   import rclpy
   from sensor_msgs.msg import Range

   @pytest.mark.launch_test
   def generate_test_description():
       node = launch_ros.actions.Node(package='range_tools', executable='range_filter',
                                      name='range_filter', output='screen')
       return launch.LaunchDescription([node, launch_testing.actions.ReadyToTest()]), {'node': node}

   class TestRunning(unittest.TestCase):
       def test_logs_start(self, proc_output, node):
           proc_output.assertWaitFor('range_filter started', process=node, timeout=10)

       def test_publishes(self):
           rclpy.init()
           try:
               n = rclpy.create_node('probe')
               got = []
               n.create_subscription(Range, 'range', got.append, 10)
               end = n.get_clock().now().nanoseconds + 10 * 10**9
               while not got and n.get_clock().now().nanoseconds < end:
                   rclpy.spin_once(n, timeout_sec=0.1)
               self.assertTrue(got)
           finally:
               rclpy.shutdown()

   @launch_testing.post_shutdown_test()
   class TestShutdown(unittest.TestCase):
       def test_exit_codes(self, proc_info):
           launch_testing.asserts.assertExitCodes(proc_info)
   ```
   Timeouts are user choices sized to the system's startup time; record the value used.
2. To exercise the real launch file instead of a single node, use `launch.actions.IncludeLaunchDescription` with `PythonLaunchDescriptionSource` pointing at the installed `launch_file`.
3. Test one behavior per test method. Do not write a test that passes without the node running (for example asserting only that the file imports).

### Output
A test file.

### Quality Gate
- `python3 -m py_compile test/test_bringup.launch.py` exits 0.
- The file contains `ReadyToTest()` and a `post_shutdown_test` class.

---

## Phase 2: Register the Test

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. `stack == 'cpp'` (ament_cmake): in `CMakeLists.txt` inside `if(BUILD_TESTING)` add `find_package(launch_testing_ament_cmake REQUIRED)` and `add_launch_test(test/test_bringup.launch.py)`. Add `<test_depend>launch_testing_ament_cmake</test_depend>`.
2. `stack == 'python'` (ament_python): pytest discovers `test/test_*.py` files, and the launch_testing pytest plugin runs files marked `@pytest.mark.launch_test`. Name the file `test/test_bringup_launch.py` if your pytest collection pattern requires the `.py` suffix after `test_`. Add `<test_depend>launch_testing</test_depend>`, `<test_depend>launch_testing_ros</test_depend>` and `<test_depend>pytest</test_depend>`.
3. Add `<test_depend>` for every message package the test imports.
4. Rebuild the package.

### Output
Registered test.

### Quality Gate
- `colcon test --packages-select <pkg> --event-handlers console_direct+` output names the launch test.

---

## Phase 3: Run and Prove It Can Fail

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. `colcon test --packages-select <pkg> --event-handlers console_direct+`, then `colcon test-result --verbose`.
2. Direct run for faster iteration: `launch_test test/test_bringup.launch.py` (the `launch_test` command ships with launch_testing).
3. Mutation check: temporarily change the expected log string to one the node never prints, rerun, and confirm the test FAILS. Revert the change and confirm it passes again. A test that cannot fail proves nothing.
4. Never weaken an assertion or raise a timeout without recording the measured reason.

### Output
`launch_test_file`, `launch_test_result`.

### Quality Gate
- `colcon test-result --verbose` shows 0 errors and 0 failures after revert.
- The mutation run's failure output is recorded.

---

## Worked Example

Illustrative only. Python package `range_tools`.

- Phase 3: `launch_test test/test_bringup.launch.py` prints `Ran 2 tests ... OK` then the post-shutdown `Ran 1 test ... OK`. With the expected string changed, `test_logs_start` fails with an assertion that the text was not found in time.

---

## Exit Criteria

DONE when the launch test runs under `colcon test`, passes, and has been shown to fail on a deliberate mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rclpy.init` already called error | **Adjust**: guard init and shutdown per test as shown, or use a class-level setup. |
| Phase 2 | Test not collected by `colcon test` | **Adjust**: check the registration step for the package type and the file name pattern. |
| Phase 3 | Flaky timeout | **Retry**: measure startup time across runs; size the timeout from the measurement and record it. |
| Phase 3 | Mutation does not fail | **Stop**: the test is not checking behavior; rewrite the assertion. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
