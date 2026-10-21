# ROS 2 C++ Components and Composition

**One-line description:** Converts an rclcpp node into a registered component in a shared library, loads it into a component container at runtime and from a launch file, and confirms intra-process communication is active when nodes share a process.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cpp_node_source` (object, required): Output of `ros2-cpp-rclcpp-node`: source paths, class name and executable.
- `workspace_dir` (string, required): Workspace root.

---

## Outputs

- `component_plugin` (object): Fully qualified plugin name (for example `range_tools::RangeFilter`), library target name, and the generated standalone executable.
- `composition_check` (object): Output of `ros2 component types`, `ros2 component list`, and the intra-process verification result.

---

## Phase 1: Make the Class a Component

### Entry Criteria
- The class constructor accepts `const rclcpp::NodeOptions &` and passes it to `rclcpp::Node`. If not, add it first; a component without this constructor cannot be loaded.
- The class is inside a namespace (for example `range_tools`).

### Actions
1. Move `main()` out of the class source file. Components have no `main`.
2. At the end of the source file add `#include "rclcpp_components/register_node_macro.hpp"` and `RCLCPP_COMPONENTS_REGISTER_NODE(range_tools::RangeFilter)`.
3. In `CMakeLists.txt` add `find_package(rclcpp_components REQUIRED)`.
4. Replace `add_executable` with `add_library(range_filter_component SHARED src/range_filter.cpp)` and link `rclcpp::rclcpp rclcpp_components::component` plus message `_TARGETS`.
5. Register: `rclcpp_components_register_node(range_filter_component PLUGIN "range_tools::RangeFilter" EXECUTABLE range_filter)`. This also generates a standalone executable so `ros2 run` still works.
6. Install the library: `install(TARGETS range_filter_component ARCHIVE DESTINATION lib LIBRARY DESTINATION lib RUNTIME DESTINATION bin)`.
7. Add `<depend>rclcpp_components</depend>` to `package.xml`.
8. Build with `colcon build --packages-up-to <pkg>`.

### Output
A shared library with a registered plugin.

### Quality Gate
- `ros2 component types` lists `range_tools::RangeFilter` under the package name.
- `ros2 run <pkg> range_filter` still starts the node.

---

## Phase 2: Load at Runtime

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Terminal A: `ros2 run rclcpp_components component_container`. It creates the node `/ComponentManager`. Use `component_container_mt` when callbacks must run in parallel.
2. Terminal B: `ros2 component load /ComponentManager <pkg> range_tools::RangeFilter -e use_intra_process_comms:=true`. It prints `Loaded component 1 into '/ComponentManager' container node as '/range_filter'`.
3. `ros2 component list` shows the container and the loaded node with its id.
4. `ros2 component unload /ComponentManager 1` unloads it; confirm with `ros2 node list`.
5. Rclpy has no equivalent composition API; Python nodes in the same process use a shared executor instead. Do not attempt to register a Python class as a component.

### Output
Runtime load and unload verified.

### Quality Gate
- `ros2 component list` shows the node after load and not after unload.

---

## Phase 3: Compose in a Launch File and Verify Intra-Process

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Write a launch file with `launch_ros.actions.ComposableNodeContainer(name='range_container', namespace='', package='rclcpp_components', executable='component_container', composable_node_descriptions=[ComposableNode(package='<pkg>', plugin='range_tools::RangeFilter', name='range_filter', extra_arguments=[{'use_intra_process_comms': True}])])`.
2. Launch it with `ros2 launch <pkg> <file>.launch.py`.
3. Intra-process delivery happens only between publisher and subscription in the same process that both have `use_intra_process_comms` enabled and compatible QoS. To confirm, publish with `std::unique_ptr` messages and log the message address in the publisher and subscriber at debug level; equal addresses mean zero-copy delivery.
4. Record that external tools (`ros2 topic echo`) still receive the topic through the middleware.

### Output
`component_plugin`, `composition_check`.

### Quality Gate
- `ros2 launch` starts the container and `ros2 component list` shows every composable node.
- The address log shows the same pointer in publisher and subscriber, or the reason it does not is recorded in `composition_check`.

---

## Worked Example

Illustrative only. `RangeFilter` and a `RangeSim` publisher composed into one container.

- Phase 1: `ros2 component types` prints `range_tools` then `  range_tools::RangeFilter` and `  range_tools::RangeSim`.
- Phase 2: `ros2 component load /ComponentManager range_tools range_tools::RangeFilter` prints `Loaded component 1 ...`.
- Phase 3: debug logs show `pub addr 0x55d1c2a0` and `sub addr 0x55d1c2a0`.

---

## Exit Criteria

DONE when the component is registered, loads and unloads at runtime, composes from a launch file, and intra-process status is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ros2 component types` does not list the plugin | **Adjust**: confirm the `PLUGIN` string equals the namespaced class name exactly and the library is installed; rebuild. |
| Phase 2 | Load fails with `Failed to find class with the requested plugin name` | **Adjust**: check spelling and that `install/setup.bash` was sourced in the container terminal. |
| Phase 2 | Load fails because the constructor has no `NodeOptions` parameter | **Return**: fix the class in `ros2-cpp-rclcpp-node` first. |
| Phase 3 | Addresses differ | **Adjust**: confirm both endpoints enable intra-process, are in one container, and publish with `std::unique_ptr`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
