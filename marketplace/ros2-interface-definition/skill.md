# ROS 2 Message and Interface Definition

**One-line description:** Defines custom .msg, .srv and .action interfaces in a dedicated ament_cmake package, generates the C++ and Python code with rosidl, and confirms the generated types with `ros2 interface show` before any node depends on them.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `workspace_dir` (string, required): Workspace root containing `src/`.
- `interface_spec` (object, required): For each interface: kind (msg, srv, action), type name, and each field with its type, units and meaning. Standard types from `std_msgs`, `geometry_msgs`, `sensor_msgs` and `builtin_interfaces` are preferred when one already fits.

---

## Outputs

- `interface_package` (string): Name of the interface package, for example `rover_interfaces`.
- `interface_check` (object): Output of `ros2 interface show` for every new type, plus the list of standard types reused instead of redefined.

---

## Phase 1: Decide Reuse or Define

### Entry Criteria
- `interface_spec` lists at least one interface.

### Actions
1. For each requested type, run `ros2 interface list | grep -i <keyword>` and `ros2 interface show <candidate>` for close matches, for example `sensor_msgs/msg/Range`, `geometry_msgs/msg/TwistStamped`, `std_srvs/srv/Trigger`.
2. Apply this rule: if a standard type carries every required field with the same units, reuse it and record it. If not, define a new type.
3. For every new type, include `std_msgs/Header header` when the data is a measurement tied to a time and a frame, so tf2 and message_filters can use it.
4. Apply the naming rules from the ROS 2 interface documentation: type names in CamelCase (`WheelSpeeds`), field names in lower snake_case (`left_rad_per_s`), constants in UPPER_SNAKE_CASE. A field name with capital letters fails code generation.
5. Use SI units per REP 103 (meters, radians, seconds) and put the unit in the field name or a comment.

### Output
A table of each requested type marked reuse or define.

### Quality Gate
- Every requested type is marked reuse (with the standard type name) or define.
- Every new field name matches the regex `^[a-z][a-z0-9_]*$`.

---

## Phase 2: Create the Interface Package

### Entry Criteria
- At least one type is marked define.

### Actions
1. In `<workspace_dir>/src`, run `ros2 pkg create --build-type ament_cmake <name>_interfaces`. Interfaces must live in an ament_cmake package even when every node is Python.
2. Create `msg/`, `srv/` and `action/` as needed and write one file per type, for example `msg/WheelSpeeds.msg`:
   ```
   std_msgs/Header header
   float64 left_rad_per_s
   float64 right_rad_per_s
   ```
   A .srv file separates request and response with a line `---`. A .action file has three sections: goal, result, feedback, separated by `---`.
3. Bounded types use `string<=64` and `float64[<=8]`; fixed arrays use `float64[4]`; defaults use `float64 gain 1.0`; constants use `uint8 MODE_IDLE=0`.
4. In `package.xml` add `<buildtool_depend>rosidl_default_generators</buildtool_depend>`, `<exec_depend>rosidl_default_runtime</exec_depend>`, `<member_of_group>rosidl_interface_packages</member_of_group>`, and a `<depend>` for every package whose types you use (for example `std_msgs`).
5. In `CMakeLists.txt` add `find_package(rosidl_default_generators REQUIRED)`, `find_package(std_msgs REQUIRED)` and:
   ```
   rosidl_generate_interfaces(${PROJECT_NAME}
     "msg/WheelSpeeds.msg"
     DEPENDENCIES std_msgs
   )
   ```
6. Edit only these files. Do not touch node packages in this phase.

### Output
An interface package that colcon can build.

### Quality Gate
- `colcon build --packages-select <name>_interfaces` reports `1 package finished`.
- `package.xml` contains `rosidl_interface_packages`.

---

## Phase 3: Verify Generated Types

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. In a new terminal source the underlay and `install/setup.bash`.
2. Run `ros2 interface show <pkg>/msg/<Type>` for every new type and compare the field list to `interface_spec`.
3. Run `ros2 interface proto <pkg>/msg/<Type>` to see the default-valued YAML you will use with `ros2 topic pub`.
4. Run `python3 -c "from <pkg>.msg import <Type>; print(<Type>())"`.
5. For C++, the header is `<pkg>/msg/<snake_case_type>.hpp`, for example `WheelSpeeds` becomes `rover_interfaces/msg/wheel_speeds.hpp`. Confirm it exists under `install/<pkg>/include/`.
6. Record that any later field change requires rebuilding and redeploying every package and every machine that uses the type. Nodes built against different definitions of the same type do not exchange data.

### Output
`interface_package`, `interface_check`.

### Quality Gate
- `ros2 interface show` succeeds for every new type and lists exactly the specified fields.
- The Python import command prints the message without an exception.

---

## Worked Example

Illustrative only. `interface_spec`: one msg `WheelSpeeds` with left and right wheel speed in rad/s.

- Phase 1: `ros2 interface list | grep -i wheel` finds nothing that fits; marked define.
- Phase 2: package `rover_interfaces` with `msg/WheelSpeeds.msg`; `colcon build --packages-select rover_interfaces` prints `Finished <<< rover_interfaces`.
- Phase 3: `ros2 interface show rover_interfaces/msg/WheelSpeeds` prints the header line and two `float64` fields.

---

## Exit Criteria

DONE when each requested type is either a recorded standard type or a built, verified custom type in one interface package.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Requested field has no unit | **Return**: ask for the unit; do not guess. |
| Phase 2 | `rosidl_generate_interfaces` error about an invalid field name | **Adjust**: rename to lower snake_case and rebuild. |
| Phase 2 | Error `Unknown type 'Header'` | **Adjust**: write `std_msgs/Header` and add `std_msgs` to `DEPENDENCIES` and `package.xml`. |
| Phase 3 | `ros2 interface show` says the type is not found | **Retry**: open a new terminal, source `install/setup.bash` again, then rerun. |
| Phase 3 | Python import fails with `No module named` | **Adjust**: confirm `rosidl_default_runtime` exec_depend is present and the package was built, not skipped. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
