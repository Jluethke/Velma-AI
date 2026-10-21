# ROS 2 Python Parameter Declaration and Runtime Reconfigure

**One-line description:** Declares every parameter in an rclpy node with a ParameterDescriptor and range, adds an on-set-parameters callback that validates new values and rejects bad ones with a reason, and proves runtime reconfiguration with `ros2 param set`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `py_node_source` (object, required): Node module from `ros2-py-rclpy-node`.
- `parameter_file` (string, required): YAML from `ros2-param-yaml-file`, which also defines the parameter table.

---

## Outputs

- `py_param_callback_report` (object): Declared parameters with descriptors, the validation rules, and the accepted and rejected `ros2 param set` transcripts.

---

## Phase 1: Declare With Descriptors

### Entry Criteria
- The parameter table exists.

### Actions
1. Import: `from rcl_interfaces.msg import ParameterDescriptor, FloatingPointRange, SetParametersResult`.
2. Declare:
   ```
   self.declare_parameter(
       'rate_hz', 20.0,
       ParameterDescriptor(
           description='Output rate in Hz',
           floating_point_range=[FloatingPointRange(from_value=1.0, to_value=50.0, step=0.0)]))
   self.rate_hz = self.get_parameter('rate_hz').value
   ```
   Range bounds come from the parameter table. Use `IntegerRange` for integers and `read_only=True` for read-only parameters.
3. Several at once: `self.declare_parameters(namespace='', parameters=[('a', 1.0), ('b', 'x')])`.
4. Declare before creating timers or publishers that use the value.

### Output
Declared parameters.

### Quality Gate
- `ros2 param describe /<node> <name>` shows description and range for every ranged parameter.

---

## Phase 2: Add the Validation Callback

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Register: `self.add_on_set_parameters_callback(self.on_set)`.
2. Implement:
   ```
   def on_set(self, params):
       new = {p.name: p.value for p in params}
       lo = new.get('min_range_m', self.min_range_m)
       hi = new.get('max_range_m', self.max_range_m)
       if lo >= hi:
           return SetParametersResult(successful=False, reason='min_range_m must be below max_range_m')
       for p in params:
           setattr(self, p.name, p.value)
       return SetParametersResult(successful=True)
   ```
3. When the rate changes, cancel and recreate the timer (`self.timer.cancel(); self.timer = self.create_timer(1.0 / self.rate_hz, self.on_timer)`); updating the number alone does not change an existing timer.
4. Do not call `set_parameters` inside the callback.

### Output
Validated runtime reconfiguration.

### Quality Gate
- Every rejection path returns `successful=False` with a non-empty `reason`.
- `python3 -m py_compile` on the module exits 0.

---

## Phase 3: Prove It at Runtime

### Entry Criteria
- The node runs with `--ros-args --params-file <parameter_file>`.

### Actions
1. `ros2 param set /<node> rate_hz 10.0` prints `Set parameter successful`; `ros2 topic hz <output>` shows the new rate.
2. `ros2 param set /<node> rate_hz 500.0` prints `Setting parameter failed`.
3. `ros2 param set /<node> rate_hz 10` fails with a type error.
4. The cross-field violation fails with your reason text.
5. A read-only parameter set fails.
6. Run `colcon test --packages-select <pkg>` and `colcon test-result --verbose`.

### Output
`py_param_callback_report`.

### Quality Gate
- Each of steps 1 to 5 has recorded CLI output matching the expectation.
- `colcon test-result --verbose` reports 0 errors and 0 failures.

---

## Worked Example

Illustrative only. `range_filter` in Python.

- Phase 3: `ros2 param set /range_filter rate_hz 10.0` prints `Set parameter successful`, and `ros2 topic hz /range` reports about `average rate: 10.0`. `ros2 param set /range_filter rate_hz 10` prints a failure naming the type.

---

## Exit Criteria

DONE when every parameter is declared with a descriptor, invalid values are rejected with a reason, accepted values change behavior, and tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Range unknown | **Return**: record as an open question in the parameter table. |
| Phase 2 | Rate change accepted but rate unchanged | **Adjust**: recreate the timer in the callback. |
| Phase 3 | `ParameterNotDeclaredException` | **Adjust**: declare the parameter, or start the node with `allow_undeclared_parameters` only if the design truly requires it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
