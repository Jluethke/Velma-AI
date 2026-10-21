# ROS 2 Python Launch File

**One-line description:** Writes a Python launch file that declares its arguments, starts each node with its parameter file, namespace and remappings, installs it into the package share directory, and verifies it with `ros2 launch --show-args` and the live graph.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workspace_dir` (string, required): Workspace root.
- `node_spec` (object, required): Nodes to start, with package, executable, name, namespace, remappings, and which arguments the operator may change.
- `parameter_file` (string, required): Installed YAML from `ros2-param-yaml-file`.

---

## Outputs

- `launch_file` (string): Package-relative path, for example `launch/bringup.launch.py`.
- `launch_check` (object): `ros2 launch <pkg> <file> --show-args` output, `ros2 node list`, and `ros2 param get` confirmations.

---

## Phase 1: Write the Launch Description

### Entry Criteria
- Every node in `node_spec` builds and runs alone with `ros2 run`.

### Actions
1. Create `launch/bringup.launch.py`. The file name must end in `.launch.py` (or `_launch.py`) to match the install glob below.
2. Use this structure:
   ```
   from launch import LaunchDescription
   from launch.actions import DeclareLaunchArgument
   from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
   from launch_ros.actions import Node
   from launch_ros.substitutions import FindPackageShare

   def generate_launch_description():
       use_sim_time = LaunchConfiguration('use_sim_time')
       params = PathJoinSubstitution([FindPackageShare('range_tools'), 'config', 'range_filter.yaml'])
       return LaunchDescription([
           DeclareLaunchArgument('use_sim_time', default_value='false',
                                 description='Use /clock from a bag or simulator'),
           Node(package='range_tools', executable='range_filter', name='range_filter',
                namespace='front', output='screen',
                parameters=[params, {'use_sim_time': use_sim_time}],
                remappings=[('range_raw', '/sensors/front/range')]),
       ])
   ```
3. Never hard-code an absolute path to a YAML file; use `FindPackageShare` so the installed copy is used.
4. Parameters later in the `parameters` list override earlier ones for the same key.
5. The `name` given here overrides the node name in code; the YAML top key must match this name (with namespace) or the values are not applied.
6. For an optional node use `condition=IfCondition(LaunchConfiguration('with_viz'))` from `launch.conditions`.

### Output
A launch file.

### Quality Gate
- `python3 -m py_compile launch/bringup.launch.py` exits 0.
- Every node in `node_spec` appears as a `Node(...)` entry.

---

## Phase 2: Install and Inspect

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. ament_cmake: `install(DIRECTORY launch DESTINATION share/${PROJECT_NAME})`. ament_python: add `(os.path.join('share', package_name, 'launch'), glob(os.path.join('launch', '*launch.[pxy][yma]*')))` to `data_files`.
2. Add `<exec_depend>launch</exec_depend>` and `<exec_depend>launch_ros</exec_depend>` to `package.xml`.
3. Rebuild and source.
4. Run `ros2 launch <pkg> bringup.launch.py --show-args`. Each declared argument prints with its description and default.
5. Run `ros2 launch <pkg> bringup.launch.py --print` (or `-p`) to print the launch description without running it, and check node names and parameter paths.

### Output
Installed and inspected launch file.

### Quality Gate
- `--show-args` lists every argument with a description.
- `ls install/<pkg>/share/<pkg>/launch/bringup.launch.py` exists.

---

## Phase 3: Run and Verify

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. `ros2 launch <pkg> bringup.launch.py`.
2. `ros2 node list` must show every node with its namespace, for example `/front/range_filter`.
3. `ros2 node info /front/range_filter` must show remapped topic names.
4. `ros2 param get /front/range_filter <name>` must return the YAML value for at least one parameter whose YAML value differs from its code default.
5. Override an argument: `ros2 launch <pkg> bringup.launch.py use_sim_time:=true` and confirm `ros2 param get /front/range_filter use_sim_time` prints `Boolean value is: True`.
6. Ctrl+C must stop all processes; `ros2 node list` afterward must not list them.

### Output
`launch_file`, `launch_check`.

### Quality Gate
- `ros2 node list` matches `node_spec` exactly.
- The argument override is visible through `ros2 param get`.

---

## Worked Example

Illustrative only. One `range_filter` under namespace `front`.

- Phase 2: `--show-args` prints `'use_sim_time': Use /clock from a bag or simulator (default: 'false')`.
- Phase 3: `ros2 node list` prints `/front/range_filter`; `ros2 node info` shows `Subscribers: /sensors/front/range`.

---

## Exit Criteria

DONE when the installed launch file starts every specified node with its parameters, namespace and remappings, and arguments override as documented.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `file 'bringup.launch.py' was not found in the share directory` | **Adjust**: fix the install rule or file name glob; rebuild. |
| Phase 3 | Parameters show code defaults | **Adjust**: make the YAML top key match `/<namespace>/<name>` or use `/**`. |
| Phase 3 | Node crashes at start under launch only | **Retry**: compare the `--print` output with the working `ros2 run` command; fix the differing argument. |
| Phase 3 | `use_sim_time` true but node time stays at 0 | **Return**: nothing publishes `/clock`; start a bag with `--clock` or a simulator. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
