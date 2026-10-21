# ROS 2 Workspace and colcon Build

**One-line description:** Creates or repairs a ROS 2 overlay workspace, resolves dependencies with rosdep, and builds it with colcon so that every package builds, every test runs, and the overlay sources cleanly on top of the distro underlay.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workspace_dir` (string, required): Absolute path of the workspace root, for example `~/ros2_ws`. Sources live in `<workspace_dir>/src`.
- `ros_distro` (string, required): The installed ROS 2 distribution name, for example `humble`, `jazzy` or `kilted`. Must match a directory under `/opt/ros/`.
- `stack` (string, required): `cpp` or `python`. Selects the package build type (`ament_cmake` or `ament_python`) for any new package.

---

## Outputs

- `build_report` (object): The exact colcon commands run, the per-package result line, the `colcon test-result --verbose` summary, and any warning text copied verbatim.
- `package_list` (string[]): Output of `colcon list --names-only` for the workspace, in build order from `colcon graph`.

---

## Phase 1: Prepare the Underlay and Layout

### Entry Criteria
- `ros_distro` is set and `/opt/ros/<ros_distro>/setup.bash` exists.
- `workspace_dir` is given.

### Actions
1. Open a NEW terminal. Do not reuse a terminal that has already sourced `<workspace_dir>/install/setup.bash`; building an overlay from a shell that sources that same overlay causes stale paths.
2. Run `source /opt/ros/<ros_distro>/setup.bash` and then `printenv ROS_DISTRO`. The output must equal `ros_distro`.
3. Run `mkdir -p <workspace_dir>/src` and `cd <workspace_dir>`.
4. If a new package is needed, run from `src/`:
   - `stack == 'cpp'`: `ros2 pkg create --build-type ament_cmake --dependencies rclcpp std_msgs <pkg_name>`
   - `stack == 'python'`: `ros2 pkg create --build-type ament_python --dependencies rclpy std_msgs <pkg_name>`
5. Run `colcon list` from `<workspace_dir>`. Each line shows package name, path and build type in parentheses.
6. Run `colcon graph` and record the order.
7. Run `sudo rosdep init` only if `/etc/ros/rosdep/sources.list.d/20-default.list` does not exist, then `rosdep update`.
8. Run `rosdep install --from-paths src --ignore-src -y --rosdistro <ros_distro>`. Do NOT add `-r`; it continues past errors and hides a missing key.

### Output
A workspace whose packages are listed by colcon and whose system dependencies are installed.

### Quality Gate
- `printenv ROS_DISTRO` prints `ros_distro`.
- `colcon list` lists every package directory under `src/`, each with a build type.
- `rosdep install` ends with `#All required rosdeps installed successfully`.

---

## Phase 2: Build

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. From `<workspace_dir>`, run `colcon build --symlink-install --event-handlers console_direct+ --cmake-args -DCMAKE_BUILD_TYPE=RelWithDebInfo`.
2. Read the final summary line `Summary: N packages finished`. Any line `Failed   <<< <pkg>` means that package failed; scroll up to the first `error:` for that package and fix only that error.
3. To rebuild one package and its dependencies after a fix, run `colcon build --symlink-install --packages-up-to <pkg>`. Use `--packages-select <pkg>` only when its dependencies are already built.
4. If colcon prints a warning that packages "are in the workspace and also exist in" an underlay, record it. Remove the duplicate from one place, or confirm the overlay version is the intended one.
5. Do not delete `build/ install/ log/` to make an error disappear unless the error names a stale CMake cache (for example a changed `CMAKE_BUILD_TYPE` or a moved source path). If so, delete only `build/<pkg>` and `install/<pkg>`.

### Output
`install/` populated for every package.

### Quality Gate
- The summary line shows zero failed packages and zero aborted packages.
- `ls install/<pkg>` exists for every entry in `package_list`.

---

## Phase 3: Test and Source

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Run `colcon test --event-handlers console_direct+`.
2. Run `colcon test-result --verbose`. It prints each failing test case and a final line `Summary: X tests, Y errors, Z failures, W skipped`.
3. Fix failing tests by fixing code. Never delete a test, mark it skipped, or remove `ament_lint_auto` to make the summary clean.
4. Open a new terminal, run `source /opt/ros/<ros_distro>/setup.bash` then `source <workspace_dir>/install/setup.bash`.
5. Run `ros2 pkg list | grep <pkg>` for each built package, and `ros2 pkg executables <pkg>`.
6. Fill `build_report` and `package_list`.

### Output
`build_report`, `package_list`.

### Quality Gate
- `colcon test-result --verbose` reports 0 errors and 0 failures.
- `ros2 pkg list` contains every name in `package_list`.
- `ros2 pkg executables <pkg>` lists every executable the package declares.

---

## Worked Example

Illustrative only. Input: `workspace_dir=~/ros2_ws`, `ros_distro=jazzy`, `stack=python`, one package `range_tools`.

- Phase 1: `ros2 pkg create --build-type ament_python --dependencies rclpy sensor_msgs range_tools`; `colcon list` prints `range_tools  src/range_tools  (ros.ament_python)`; rosdep prints `#All required rosdeps installed successfully`.
- Phase 2: `colcon build --symlink-install` ends with `Summary: 1 package finished [2.1s]`.
- Phase 3: `colcon test-result --verbose` prints `Summary: 3 tests, 0 errors, 0 failures, 0 skipped` (copyright, flake8, pep257). `ros2 pkg executables range_tools` prints `range_tools range_filter`.

---

## Exit Criteria

DONE when every package builds with zero failures, `colcon test-result` shows zero errors and zero failures, and the sourced overlay exposes every package and executable.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `/opt/ros/<ros_distro>` missing | **Stop**: install the distro from the official binary packages first. |
| Phase 1 | rosdep reports `Cannot locate rosdep definition for [x]` | **Adjust**: check the dependency name in `package.xml` against `rosdep resolve x`; fix the name, do not delete the dependency. |
| Phase 2 | Python package builds but `ros2 run` says `No executable found` | **Adjust**: confirm `setup.cfg` has `script_dir=$base/lib/<pkg>` and `install_scripts=$base/lib/<pkg>`, and `entry_points` lists the console script. |
| Phase 2 | C++ executable missing from `ros2 pkg executables` | **Adjust**: add `install(TARGETS <exe> DESTINATION lib/${PROJECT_NAME})` to CMakeLists.txt and rebuild. |
| Phase 3 | Lint test fails (flake8, cpplint, uncrustify) | **Adjust**: fix the reported file and line; rerun `colcon test`. |
| Phase 3 | Build passes only with `--symlink-install` removed | **Return**: record it in `build_report`; it usually means a file is not installed and only resolves from the source tree. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
