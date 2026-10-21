# Bench Actuation Test Behind A Hardware Emergency Stop

**One-line description:** Runs the controller build against real actuators on a bench rig with an independent hardware emergency stop, in a fixed sequence of e-stop proof, sign and unit checks, rate and saturation checks, and logged small-amplitude steps, and issues a `bench_verdict` that gates any closed-course run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `control_spec` (object, required): Supplies limits, site and emergency-stop facts.
- `stability_report` (object, required): From `ctrl-stability-margins`; every loop must be PASS or explicitly accepted by the user.
- `py_controller_build` (object, optional): From `ctrl-impl-py`; present when `stack` is `python`.
- `cpp_controller_build` (object, optional): From `ctrl-impl-cpp`; present when `stack` is `cpp`.
- `py_timing_report` (object, optional): From `ctrl-loop-timing-py`; required with `py_controller_build`.
- `cpp_timing_report` (object, optional): From `ctrl-loop-timing-cpp`; required with `cpp_controller_build`.

---

## Outputs

- `bench_log` (object): Session record (date, people present, build commit, emergency-stop test result) and per-test logs with commanded and measured actuator signals at the controller period.
- `bench_verdict` (string): `PASS` when every bench test meets its criterion; otherwise `FAIL` with the failing test. Only `PASS` allows `ctrl-closed-course-run`.

---

## Phase 1: Preconditions And Emergency-Stop Proof

### Entry Criteria
- Actuation runs only on a bench rig (actuator mounted on a fixture, or vehicle with drive wheels off the ground on rated stands as the user's rig design specifies) behind an independent hardware emergency stop that removes actuator power without depending on the control computer.
- Exactly one controller build and its timing report are present, and the timing report is PASS.
- `stability_report` has no FAIL, or the user accepted each FAIL in writing.
- Two people present: one operator, one person whose only task is the emergency stop.

### Actions
1. Walk the area; nobody within reach of moving parts. Record names and roles.
2. Power the actuators. Command nothing. Press the emergency stop; confirm actuator power is removed by the indicator or a meter reading on the actuator supply. Reset. Record the time and result.
3. Confirm the controller cannot reset or override the emergency stop: with the stop pressed, start the controller in ENGAGED with a nonzero test request; actuator must not move. Record.
4. Confirm the brake path is independent: the controller has no code path that delays or blocks a brake or emergency-stop command (cite the README statement from the build and the code review result).

### Output
Signed precondition record in `bench_log`.

### Quality Gate
- `bench_log` shows emergency-stop press result "power removed" with a timestamp earlier than any actuation test.
- Step 3 records "no motion".

---

## Phase 2: Sign, Unit And Limit Checks

### Entry Criteria
- Phase 1 complete today.

### Actions
1. Sign: command the smallest steering request the user chooses to the left. Confirm the measured angle is positive (left) per `control_spec` convention. Repeat right. Same for longitudinal request direction on the rig.
2. Units: command a known angle; compare measured angle with an independent measurement (protractor on the road wheel or the steering angle sensor reading). Record the ratio.
3. Rate limit: request a step larger than one cycle's rate allowance; confirm from the log that measured rate never exceeds the configured limit and that `rate_limited` flags were set.
4. Saturation: request beyond the configured maximum; confirm the applied command stops at the maximum.
5. Fault: unplug or stop one sensor stream; confirm FAULT within the configured stale-age and the "no motion request" output.

### Output
Check results in `bench_log`.

### Quality Gate
- Each of the five checks has a log file and a PASS or FAIL line.

---

## Phase 3: Logged Response Tests

### Entry Criteria
- Phase 2 all PASS.

### Actions
1. Steering actuator steps and longitudinal steps at the amplitudes from the user's list, smallest first. Log commanded, applied and measured values.
2. Fit the actuator lag and delay from these steps (same method as `ctrl-model-fit-from-logs` Phase 2) and compare with the values used in simulation.
3. If measured delay or lag exceeds the simulated value, rerun `ctrl-closed-loop-sim-py` and `ctrl-stability-margins` with the measured values before any closed-course run.
4. Write `bench_verdict`.

### Output
`bench_log`, `bench_verdict`.

### Quality Gate
- Measured delay and lag are printed next to the simulated values.
- `bench_verdict` is `PASS` only if Phase 2 passed and measured delay and lag are at or below the simulated values (or the sim and margins were rerun and passed).

---

## Worked Example

Illustrative only. C++ build `7c2e01d`, steering actuator on a fixture.

- Phase 1: e-stop pressed 09:12, power removed (supply LED off, 0 V at connector). Engaged with stop pressed: no motion.
- Phase 2: left request gives +0.02 rad; rate limit 0.5 rad/s respected (max measured 0.49 rad/s); sensor unplug gives FAULT in 0.06 s.
- Phase 3: measured steering delay 0.10 s, lag 0.14 s, both at or below sim values 0.12 s and 0.15 s. `bench_verdict = PASS`.

---

## Exit Criteria

DONE when the emergency stop is proven first, all sign, unit, limit and fault checks pass, measured actuator dynamics are within simulated values, and `bench_verdict` is written.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Emergency stop does not remove power | **Stop**: no actuation; fix the hardware path. |
| Phase 1 | Controller moved actuator with stop pressed | **Stop**: the stop is not independent; redesign before any test. |
| Phase 2 | Sign reversed | **Stop**: press the emergency stop if moving; fix the convention in config, rerun Phase 2 from the start. |
| Phase 3 | Measured delay above simulated | **Return**: rerun simulation and margins with measured values. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
