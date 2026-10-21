# ROS 2 rclcpp Node in C++

**One-line description:** Writes one rclcpp node class with its publishers, subscriptions and timers, wires it into CMake with the correct link targets and install rule, and proves it runs by observing its topics with the ros2 CLI.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workspace_dir` (string, required): Workspace root.
- `node_spec` (object, required): Node name, package, every topic it publishes or subscribes with message type, rate where periodic, and the processing it performs.
- `interface_package` (string, required): Package holding custom types, or `none` when only standard types are used.

---

## Outputs

- `cpp_node_source` (object): Paths of the header, source and CMakeLists.txt edits, plus the executable name.
- `cpp_build_result` (object): The colcon build summary line, `colcon test-result` summary, and the `ros2 node info` output for the running node.

---

## Phase 1: Write the Node Class

### Entry Criteria
- The package exists with build type `ament_cmake`.
- `node_spec` names every topic with a type.

### Actions
1. Create `src/<node_name>.cpp` with one class deriving from `rclcpp::Node`. Give the constructor a `const rclcpp::NodeOptions & options = rclcpp::NodeOptions()` parameter and pass it to `Node("<node_name>", options)`. This keeps the class reusable as a component later.
2. Create each publisher as a member: `pub_ = create_publisher<sensor_msgs::msg::Range>("range", rclcpp::QoS(10));`. Use a relative topic name (no leading `/`) so namespaces and remaps apply.
3. Create each subscription with a member function callback taking `const <Type>::SharedPtr msg` or `const <Type> & msg`. Keep the returned `SharedPtr` as a member; a subscription that goes out of scope stops receiving with no error.
4. For periodic work use `create_wall_timer(std::chrono::milliseconds(<period>), std::bind(&Class::on_timer, this))`, with the period derived from `node_spec` rate. Use `create_timer(...)` with `this->get_clock()` instead when the node must follow `use_sim_time`.
5. Log with `RCLCPP_INFO(get_logger(), ...)`, never `std::cout`, so output goes to `/rosout` and `ros2 run --ros-args --log-level` works.
6. Add `main`: `rclcpp::init(argc, argv); rclcpp::spin(std::make_shared<Class>()); rclcpp::shutdown(); return 0;`.
7. Do not invent rclcpp methods. If unsure whether a method exists in your distro, open the rclcpp API docs for `ros_distro` and confirm.

### Output
One compilable node source file.

### Quality Gate
- `grep -c "SharedPtr" src/<node_name>.cpp` shows every publisher, subscription and timer stored as a member.
- No `std::cout` remains: `grep -n "std::cout" src/<node_name>.cpp` returns nothing.

---

## Phase 2: Wire CMake and package.xml

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. In `CMakeLists.txt` add `find_package(rclcpp REQUIRED)` and one `find_package` per message package.
2. Add `add_executable(<exe> src/<node_name>.cpp)`.
3. Link with modern targets: `target_link_libraries(<exe> rclcpp::rclcpp ${sensor_msgs_TARGETS})`. On distros before Kilted, `ament_target_dependencies(<exe> rclcpp sensor_msgs)` also works; on Kilted and newer it is deprecated, so prefer `target_link_libraries`.
4. For custom types from `interface_package` in another package, add `find_package(<interface_package> REQUIRED)` and `${<interface_package>_TARGETS}`.
5. Add `install(TARGETS <exe> DESTINATION lib/${PROJECT_NAME})`. Without it `ros2 run` reports `No executable found`.
6. Add a `<depend>` line in `package.xml` for every `find_package`.
7. Build: `colcon build --packages-up-to <pkg> --event-handlers console_direct+`.

### Output
A built executable.

### Quality Gate
- Build summary shows zero failed packages.
- `ros2 pkg executables <pkg>` lists `<exe>` after sourcing `install/setup.bash`.

---

## Phase 3: Run and Observe

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Terminal A: `ros2 run <pkg> <exe> --ros-args --log-level debug`.
2. Terminal B: `ros2 node list` must show `/<node_name>`. Then `ros2 node info /<node_name>` and compare Publishers and Subscribers to `node_spec`.
3. For each published topic run `ros2 topic hz <topic>` for at least the window it prints twice, and compare the `average rate` to the rate in `node_spec`.
4. For each subscription, feed one message: `ros2 topic pub --once <topic> <type> "<yaml>"` using the YAML from `ros2 interface proto <type>`, and confirm the node logs the expected reaction.
5. Run `colcon test --packages-select <pkg>` and `colcon test-result --verbose`.

### Output
`cpp_node_source`, `cpp_build_result`.

### Quality Gate
- `ros2 node info` lists exactly the topics in `node_spec` with the stated types.
- `ros2 topic hz` average rate is printed for every periodic publisher.
- `colcon test-result --verbose` shows 0 errors and 0 failures.

---

## Worked Example

Illustrative only. `node_spec`: node `range_filter` subscribes `range_raw` (sensor_msgs/msg/Range), publishes `range` at the input rate.

- Phase 1: class `RangeFilter : public rclcpp::Node`, subscription stored in `sub_`, publisher in `pub_`.
- Phase 2: `target_link_libraries(range_filter rclcpp::rclcpp ${sensor_msgs_TARGETS})`; build prints `Finished <<< range_tools`.
- Phase 3: `ros2 node info /range_filter` shows `Subscribers: /range_raw: sensor_msgs/msg/Range` and `Publishers: /range: sensor_msgs/msg/Range` along with the default parameter and rosout entries.

---

## Exit Criteria

DONE when the node builds, its graph connections match `node_spec`, periodic topics publish at the specified rate, and package tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `node_spec` lacks a message type | **Return**: request the type; do not choose one. |
| Phase 2 | Linker error `undefined reference` to a message symbol | **Adjust**: add the message package `_TARGETS` to `target_link_libraries` and its `<depend>`. |
| Phase 2 | `fatal error: <pkg>/msg/<Type>.hpp: No such file` | **Adjust**: use the snake_case header name. |
| Phase 3 | Node runs but `ros2 topic hz` prints nothing | **Adjust**: check `ros2 topic info -v` for a QoS mismatch, then run `ros2-qos-incompatibility-debug`. |
| Phase 3 | Node exits immediately | **Retry**: run with `--log-level debug` and read the last log line before exit; fix that cause. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
