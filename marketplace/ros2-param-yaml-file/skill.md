# ROS 2 Parameter Declaration and YAML File

**One-line description:** Lists every tunable value of a node as a declared, typed parameter with a descriptor, writes the matching `ros__parameters` YAML file, and proves the node loads it by reading values back with `ros2 param get` and `ros2 param dump`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `node_spec` (object, required): Node name, namespace, and every tunable value with type, unit, allowed range source, and default.

---

## Outputs

- `parameter_file` (string): Path of the installed YAML file, for example `config/range_filter.yaml`.
- `parameter_check` (object): `ros2 param list`, `ros2 param describe` and `ros2 param dump` output for the running node.

---

## Phase 1: Specify Parameters

### Entry Criteria
- `node_spec` lists the tunable values.

### Actions
1. Build a table with one row per parameter: name (lower snake_case, unit suffix such as `rate_hz`, `max_range_m`), type (`bool`, `integer`, `double`, `string`, or an array of these), default, range, read_only, and description.
2. A range or default must come from a datasheet, a named standard, a documented tool default, or the user. If none exists, mark it as an open question instead of inventing a value.
3. Choose type carefully. ROS 2 parameters are statically typed by default since Galactic: a parameter declared as `double` rejects `ros2 param set /n rate_hz 20` because `20` is parsed as an integer. Write defaults for doubles with a decimal point (`20.0`).
4. Mark values that must not change after startup (for example a frame id or device path) as read_only.

### Output
Parameter table.

### Quality Gate
- Every row has a type, a sourced default or an open question, and a description.

---

## Phase 2: Write the YAML and Install It

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Create `config/<node_name>.yaml`:
   ```
   range_filter:
     ros__parameters:
       rate_hz: 20.0
       max_range_m: 4.0
       frame_id: "range_link"
   ```
   The top key is the node name (with namespace as `/ns/node` if namespaced). Use `/**:` to apply to all nodes. The key `ros__parameters` has two underscores.
2. Install the directory. ament_cmake: `install(DIRECTORY config DESTINATION share/${PROJECT_NAME})`. ament_python: add `(os.path.join('share', package_name, 'config'), glob('config/*.yaml'))` to `data_files` and `from glob import glob` at the top of `setup.py`.
3. Rebuild the package.
4. Declarations in code are written by the stack-specific callback flow (`ros2-cpp-param-callback` or `ros2-py-param-callback`). This flow only defines the contract and the file.

### Output
Installed YAML file.

### Quality Gate
- `ls install/<pkg>/share/<pkg>/config/<node_name>.yaml` exists.
- `python3 -c "import yaml,sys; d=yaml.safe_load(open(sys.argv[1])); print(list(d.values())[0]['ros__parameters'])" config/<node_name>.yaml` prints every parameter.

---

## Phase 3: Prove the Node Loads It

### Entry Criteria
- The node declares the parameters in code.

### Actions
1. Run `ros2 run <pkg> <exe> --ros-args --params-file install/<pkg>/share/<pkg>/config/<node_name>.yaml`.
2. Run `ros2 param list /<node_name>` and confirm every name appears.
3. Run `ros2 param get /<node_name> <name>` for each parameter; the value must equal the YAML, not the code default. Change one YAML value temporarily if the defaults are identical, so the test can tell them apart.
4. Run `ros2 param describe /<node_name> <name>` and confirm type, description, range and read-only flag.
5. Run `ros2 param dump /<node_name>` and keep the output as `parameter_check`. On Humble and newer it prints YAML to stdout.

### Output
`parameter_file`, `parameter_check`.

### Quality Gate
- `ros2 param get` returns the YAML value for every parameter.
- `ros2 param describe` shows the declared type for every parameter.

---

## Worked Example

Illustrative only. `range_filter` with `rate_hz` (double), `max_range_m` (double, from the sensor datasheet), `frame_id` (string, read only).

- Phase 2: YAML installed to `share/range_tools/config/range_filter.yaml`.
- Phase 3: `ros2 param get /range_filter max_range_m` prints `Double value is: 4.0`; `ros2 param describe /range_filter frame_id` shows `Read only: true`.

---

## Exit Criteria

DONE when every tunable value is a declared, typed, described parameter, its YAML file is installed, and the running node reports the YAML values.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No source for a range | **Return**: record an open question; do not invent the bound. |
| Phase 3 | `ros2 param get` shows the code default | **Adjust**: check the YAML top key matches the node's full name, including namespace and any remapped `__node` name. |
| Phase 3 | Node fails with `InvalidParameterTypeException` | **Adjust**: fix the YAML literal type (for example `20` to `20.0`). |
| Phase 3 | Parameter missing from `ros2 param list` | **Return**: the node does not declare it; fix it in the stack-specific callback flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
