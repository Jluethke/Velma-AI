# Emergency Stop Chain Bench Verification

**One-line description:** Proves on the bench, with drive wheels off the ground or actuators uncoupled, that every stop source removes actuator power, that wire breaks, supply loss and a simulated welded contactor behave as designed, that reset requires the physical button, and that software cannot hold power on, measuring each stop time with an oscilloscope or logic analyzer.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `estop_design` (object, required): Output of `fusa-estop-chain-design`.
- `bench_setup` (string, required): Description of the bench: how wheels are lifted or actuators uncoupled, measurement equipment (oscilloscope or logic analyzer model and channel count), who holds the wireless stop.

---

## Outputs

- `estop_test_record` (object): `date`, `hardware_revision`, `tests` (id, rule, procedure, expected, observed, stop_time_ms, pass), `failures`, `retest_required`, `capture_files`.

---

## Phase 1: Prepare the Bench

### Entry Criteria
- Bench only: drive wheels lifted clear of the ground on rated stands, or every actuator mechanically uncoupled from its load. No person within reach of moving parts.
- An independent hardware emergency stop is in place and has been pressed once to confirm power drops before any other test.
- `estop_design.design_rule_checks` all pass on the drawing.

### Actions
1. Record `hardware_revision` and the date.
2. Connect measurement channels: CH1 on the stop source contact (or the safety relay input), CH2 on actuator supply after `K1`/`K2` (or the STO input), CH3 on motor phase current via a current probe if available, CH4 on the `K_SW` coil drive.
3. Set the scope to single-shot trigger on the CH1 falling edge, pre-trigger 20 percent of the screen, and a timebase long enough to see the slowest expected stop (use the category 1 delay from the design plus margin if category 1).
4. Power the system, press reset, and command a low, constant actuator motion from the normal software path (for example wheel spin at the lowest speed the controller accepts). This command is only issued with the bench conditions above.

### Output
Bench ready with capture setup recorded.

### Quality Gate
- A photo or written note confirms wheels are off the ground or actuators uncoupled.
- The initial independent stop press dropped CH2 to zero (one capture saved).

---

## Phase 2: Stop Source and Fault Tests

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Run each test, one at a time, re-establishing motion between tests. Save each capture as `estop_<test_id>.csv` or the scope's native format.

   | Test id | Procedure | Expected |
   |---|---|---|
   | T1..Tn | press each stop button in turn | CH2 drops; actuator stops; stays stopped after the button is released |
   | TRF | press the wireless stop | as above |
   | TLINK | switch off the wireless transmitter or move out of range per its manual | stop on link loss |
   | TSW | stop the software process (`kill -STOP <pid>`) or halt the supervisory MCU | `K_SW` coil drops, platform stops |
   | TWIRE | unplug each loop connector in turn | stop for each |
   | TSUP | remove loop supply | stop |
   | TWELD | with the actuator supply disconnected and locked out (safety relay control supply still on), disconnect the mirror contact wire of `K1` from the feedback loop, which is what the relay sees when `K1` is welded, then attempt reset; restore the wire and repeat for `K2` | reset refused both times |
   | TRESET | after a stop, release the button only | no motion; motion only after reset plus a new command |

2. For each test, read `stop_time_ms` from the capture: time from CH1 edge to CH2 below the actuator's off level. Compare with the detection-plus-reaction budget in the safety goals when one exists.
3. Try to restart from software alone after a stop (send motion commands, toggle every GPIO the software owns). Expected: no power returns.

### Output
Observed result and stop time per test.

### Quality Gate
- Every test row has a saved capture file name.
- Every test row has `pass` true or false based on the expected column, not on judgment.
- TSW and the software restart attempt both show no power without the physical reset.

---

## Phase 3: Record and Disposition

### Entry Criteria
- Phase 2 complete.

### Actions
1. Any failed test sets `retest_required = true`, blocks all closed-course testing, and goes back to `fusa-estop-chain-design` with the capture attached.
2. Record the stop time per source. If a stop time exceeds a budget from the safety goals, mark it failed even if the platform stopped.
3. Store captures beside the record and list them in `capture_files`.
4. State in the record that the stop chain must be re-verified after any wiring change and before each closed-course session (at least T1, TRF and TLINK).

### Output
`estop_test_record`.

### Quality Gate
- `jq '[.tests[]|select(.pass==false)]|length' estop_test_record.json` equals the length of `failures`.
- `capture_files` count equals the number of tests run.

---

## Worked Example

Illustrative only. Cart on stands, wheels free.

```
Test  Source         Observed                          stop_time_ms  pass
T1    ES1 dash       CH2 48V -> 0V, wheel coasts        38           true
TRF   RF1 press      CH2 drops                          112          true
TLINK transmitter off CH2 drops after link timeout       610          true
TSW   kill -STOP     K_SW coil off, CH2 drops           41           true
TWELD K1 fb open     reset refused                       n/a          true
```
TLINK takes 610 ms because the receiver's link timeout dominates; if a goal budget is shorter, the wireless unit is noted as a failure against that goal.

---

## Exit Criteria

DONE when every stop source and fault case has a capture, a measured stop time, a pass or fail result, and any failure blocks closed-course testing until fixed and retested.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Wheels cannot be lifted or actuators uncoupled | **Stop**: do not run powered tests. |
| Phase 2 | Any stop source fails to stop | **Stop**: remove power at the independent stop, fix, restart Phase 1. |
| Phase 2 | Software restarts motion without reset | **Stop**: design defect; return to `fusa-estop-chain-design`. |
| Phase 2 | Scope misses the edge | **Retry**: recheck trigger level and timebase. |
| Phase 3 | Team wants to test on track with a failed item | **Stop**: failures block the track. |

**Do not:** jumper a stop contact to keep testing, run any test with the vehicle on the ground, or record a pass without a capture.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
