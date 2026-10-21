# ROS 2 C++ Parameter Declaration and Runtime Reconfigure

**One-line description:** Declares every parameter in an rclcpp node with a ParameterDescriptor and range, adds a set-parameters callback that validates new values and rejects bad ones with a reason, and proves runtime reconfiguration with `ros2 param set` and rqt_reconfigure.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cpp_node_source` (object, required): Node source from `ros2-cpp-rclcpp-node`.
- `parameter_file` (string, required): YAML from `ros2-param-yaml-file`, which also defines the parameter table.

---

## Outputs

- `cpp_param_callback_report` (object): Declared parameters with descriptors, the callback's validation rules, and the accepted and rejected `ros2 param set` transcripts.

---

## Phase 1: Declare With Descriptors

### Entry Criteria
- The parameter table exists.

### Actions
1. For each double with a range:
   ```
   rcl_interfaces::msg::ParameterDescriptor d;
   d.description = "Output rate in Hz";
   rcl_interfaces::msg::FloatingPointRange r;
   r.from_value = 1.0; r.to_value = 50.0; r.step = 0.0;
   d.floating_point_range.push_back(r);
   rate_hz_ = declare_parameter("rate_hz", 20.0, d);
   ```
   Range bounds come from the parameter table, never from this example. Use `IntegerRange` for integers. Set `d.read_only = true` for read-only parameters.
2. Declare in the constructor before creating anything that depends on the value.
3. Do not call `get_parameter` inside a hot loop; cache the value in a member and update it from the callback.

### Output
Declared parameters.

### Quality Gate
- `ros2 param describe /<node> <name>` shows the description and range for every ranged parameter.

---

## Phase 2: Add the Validation Callback

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Add a member `rclcpp::node_interfaces::OnSetParametersCallbackHandle::SharedPtr param_cb_;`. If the handle is not stored, the callback is unregistered immediately and silently.
2. Register: `param_cb_ = add_on_set_parameters_callback(std::bind(&Class::on_set, this, std::placeholders::_1));`
3. Implement `rcl_interfaces::msg::SetParametersResult on_set(const std::vector<rclcpp::Parameter> & params)`:
   - Start with `result.successful = true`.
   - For each parameter, check cross-field rules the descriptor cannot express (for example `min_range_m < max_range_m`). On failure set `successful = false`, set `result.reason` to a message naming the parameter and rule, and return.
   - Only after all checks pass, copy the new values into cached members.
4. Do not call `set_parameter` inside this callback. On Iron and newer, use `add_post_set_parameters_callback` if a side effect must run after acceptance; confirm the method in the rclcpp API for your distro.
5. If the callback and the timer touch the same member from different threads (multi-threaded executor), protect it with a mutex or `std::atomic`.

### Output
Validated runtime reconfiguration.

### Quality Gate
- `grep -n "param_cb_" src/*.cpp` shows the handle stored as a member.
- The callback has a non-empty `reason` on every rejection path.

---

## Phase 3: Prove It at Runtime

### Entry Criteria
- The node builds and runs with `--params-file <parameter_file>`.

### Actions
1. Accepted: `ros2 param set /<node> rate_hz 10.0` prints `Set parameter successful`. Confirm the behavior changed with `ros2 topic hz <output topic>`.
2. Out of range: `ros2 param set /<node> rate_hz 500.0` must print `Setting parameter failed` with the range reason.
3. Wrong type: `ros2 param set /<node> rate_hz 10` must fail with a type error.
4. Cross-field violation must fail with your `reason` text.
5. Read only: setting a read-only parameter must fail.
6. Optional GUI: `ros2 run rqt_reconfigure rqt_reconfigure` shows sliders for ranged parameters.

### Output
`cpp_param_callback_report`.

### Quality Gate
- Each of steps 1 to 5 has its CLI output recorded and matches the expected result.
- `ros2 topic hz` shows the new rate after step 1.

---

## Worked Example

Illustrative only. `range_filter` with `min_range_m` and `max_range_m`.

- Phase 2: callback rejects `min_range_m >= max_range_m` with reason `min_range_m must be below max_range_m`.
- Phase 3: `ros2 param set /range_filter min_range_m 5.0` prints `Setting parameter failed: min_range_m must be below max_range_m`.

---

## Exit Criteria

DONE when every parameter is declared with a descriptor, invalid values are rejected with a reason, and accepted values change behavior at runtime.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Range unknown | **Return**: the table must supply it or mark it open. |
| Phase 2 | Callback never fires | **Adjust**: store the returned handle in a member. |
| Phase 3 | Set succeeds but behavior unchanged | **Adjust**: the cached member is not updated or the timer was not recreated; fix and retest. |
| Phase 3 | Data race reported by ThreadSanitizer | **Adjust**: guard shared members; rerun under `-fsanitize=thread`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
