# Control Spec Intake

**One-line description:** Collects every vehicle parameter, motion limit, test site fact and emergency-stop fact the planning and control flows need into one unit-checked `control_spec`, and lists every missing constant as an open question instead of guessing it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `vehicle_params` (object, required): User-supplied vehicle facts with units: wheelbase (m), front and rear axle distance to center of mass (m), mass (kg), steering ratio (road wheel to handwheel), maximum road wheel angle (rad), track width (m), and, if known, yaw inertia (kg m^2) and front and rear cornering stiffness (N/rad).
- `motion_limits` (object, required): User-supplied limits: maximum speed (m/s), maximum acceleration and deceleration (m/s^2), maximum longitudinal jerk (m/s^3), maximum lateral acceleration (m/s^2), maximum road wheel angle rate (rad/s), controller period (s), and tracking tolerances for cross-track, heading and speed error.
- `test_site` (object, required): Where actuation will run: bench rig description or closed course description, who controls access, and the maximum speed the site allows.
- `estop_description` (object, required): The independent hardware emergency stop: what it physically interrupts (for example actuator power contactor), how it is triggered (button, wireless handset), and how it was last tested.
- `stack` (string, required): Implementation stack, `python` or `cpp`.

---

## Outputs

- `control_spec` (object): One record with every parameter in SI units, its source (user, datasheet, measured log), the stack, the site and the emergency-stop facts. Every downstream `ctrl-` flow reads its constants from here.
- `open_questions` (object[]): Every required value that is missing or inconsistent, with the flow that needs it. Empty when complete.

---

## Phase 1: Collect And Normalize Units

### Entry Criteria
- `vehicle_params`, `motion_limits`, `test_site`, `estop_description` and `stack` are present.

### Actions
1. Create a table with columns: name, value, unit as given, SI value, source.
2. Convert every value to SI: km/h to m/s (divide by 3.6), degrees to radians (multiply by pi/180), g to m/s^2 only if the user states which value of g they used. Do not convert handwheel angle to road wheel angle unless the steering ratio is given.
3. Record the source of each value exactly as the user gave it (owner's manual page, spec sheet, measured, estimated).
4. If a value is labeled "estimated" or "approximate", keep it but add an open question asking for a measurement method.
5. Do not fill any value from memory or from a "typical car" figure. A missing value becomes an `open_questions` row.

### Output
Normalized parameter table in SI units.

### Quality Gate
- Every row has an SI value and a source column that is not empty.
- `grep -c "typical" control_spec` (or a search of the record) finds no value sourced as "typical" or "assumed".

---

## Phase 2: Consistency Checks

### Entry Criteria
- Normalized table exists.

### Actions
1. Check lf + lr equals the wheelbase within the precision the user gave. If not, record an open question.
2. Check maximum deceleration and maximum acceleration are positive magnitudes and record the sign convention used downstream: acceleration positive forward, deceleration stored as a positive magnitude.
3. Check the controller period is positive and record its inverse as the loop rate in Hz.
4. Check the site maximum speed from `test_site` against `motion_limits` maximum speed. Use the smaller of the two as `v_max_test` and record which one bound it.
5. Check `stack` is exactly `python` or `cpp`. Any other value is an open question.
6. Check whether yaw inertia and cornering stiffness are present. If not, mark the dynamic bicycle model and the dynamic LQR variant as unavailable and record it; kinematic flows still run.

### Output
Checked parameter table with a list of failed checks.

### Quality Gate
- Each check above has a recorded result: pass, or an `open_questions` row naming the field.
- `v_max_test` is present and names its binding source.

---

## Phase 3: Safety Facts And Emit

### Entry Criteria
- Checks complete.

### Actions
1. Confirm `estop_description` names a hardware device that removes actuator power or engages a mechanical stop without depending on the control computer. If the stop is a software button, a ROS topic, or a message the controller software must process, record it as a blocking open question: actuation flows will refuse to run.
2. Record the date of the last emergency-stop function test from `estop_description`. Missing date is an open question.
3. Record that braking and emergency stop are outside the controller's authority: no flow may add logic that gates, delays or filters a brake or emergency-stop command.
4. Write `control_spec` as JSON (for example `control_spec.json`) with keys: `vehicle`, `limits`, `site`, `estop`, `stack`, `sources`.
5. Write `open_questions` with fields: field, needed_by (flow name), reason.

### Output
`control_spec` and `open_questions`.

### Quality Gate
- `python -c "import json; json.load(open('control_spec.json'))"` exits 0.
- `control_spec.estop` names a hardware device, or `open_questions` contains a blocking row for it.
- Every key needed by later flows (wheelbase, max road wheel angle, rate limits, jerk and acceleration limits, controller period) is present or listed in `open_questions`.

---

## Worked Example

Illustrative only. Input: wheelbase 2.70 m, lf 1.20 m, lr 1.50 m, max road wheel angle 30 deg, steer rate 0.5 rad/s, a_max 2.0 m/s^2, decel 3.0 m/s^2, jerk 1.5 m/s^3 (all user supplied from their test plan), period 0.02 s, closed course limit 25 km/h, e-stop "wireless handset that opens the actuator power contactor".

- Phase 1: 30 deg becomes 0.5236 rad; 25 km/h becomes 6.944 m/s.
- Phase 2: lf + lr = 2.70 m passes; loop rate 50 Hz; `v_max_test` = 6.944 m/s bound by site. Cornering stiffness missing, so the dynamic LQR variant is marked unavailable.
- Phase 3: e-stop accepted as hardware. `open_questions`: cornering stiffness (needed by `ctrl-lqr-lateral` dynamic variant), last e-stop test date.

---

## Exit Criteria

DONE when `control_spec` parses as JSON with SI values and sources, and every missing or inconsistent value appears in `open_questions` with the flow that needs it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Unit missing on a value | **Return**: ask the user for the unit; never assume one. |
| Phase 2 | lf + lr disagrees with wheelbase | **Return**: list both values as an open question. |
| Phase 3 | Emergency stop is software only | **Stop**: record a blocking open question; actuation flows cannot start. |
| Phase 3 | JSON fails to parse | **Retry**: fix the syntax and rerun the parse check. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
