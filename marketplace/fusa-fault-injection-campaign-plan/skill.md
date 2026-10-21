# Fault Injection Campaign Plan from FMEA and Fault Tree Results

**One-line description:** Builds a fault injection campaign in which every injected fault traces to an FMEA row or a minimal cut set, names the injection method and location, the safety mechanism expected to detect it, the expected reaction and safe state, the time budget, and the measurement that decides pass or fail, ordered so the riskiest mechanisms are tested first and all tests run on a bench behind an independent hardware emergency stop.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dfmea_worksheet` (object[], required): Output of `fusa-dfmea-worksheet`.
- `sw_fmea_rows` (object[], required): Output of `fusa-sw-fmea-interface-guidewords`.
- `cut_set_report` (object, required): Output of `fusa-fta-scram-cut-sets`.
- `safety_requirements` (object[], required): Output of `fusa-requirements-decomposition`.

---

## Outputs

- `fault_injection_plan` (object[]): `fi_id`, `source_row` (FMEA row id or cut set), `fault_model`, `injection_method`, `injection_location`, `stack` (embedded-c, linux-c, linux-python, ros2, can, hardware), `expected_detection` (mechanism and file:line or part), `expected_reaction`, `safe_state`, `time_budget` (with source), `measurement`, `pass_rule`, `priority`, `entry_conditions`.

---

## Phase 1: Select Faults

### Entry Criteria
- All three analysis inputs are non-empty.

### Actions
1. Take every safety mechanism claimed in `safety_requirements` (each detection TSR). Each mechanism needs at least one fault that it must detect; without one, the mechanism is untested.
2. Add every FMEA row with `linked_safety_goal` and every SW FMEA row with `existing_detection` not `none`.
3. Add one fault per order 2 cut set that makes the remaining event in the set the only barrier (for example inject `CMD_IMPLAUSIBLE` with the check working, to prove the check is the barrier).
4. Do not add faults for rows with `gap = true` as if they passed; list them as "expected to fail" so the test documents the gap.

### Output
Candidate fault list with sources.

### Quality Gate
- Every detection TSR id appears in at least one candidate's `expected_detection`.
- Every candidate has a `source_row`.

---

## Phase 2: Define Method, Expectation and Pass Rule

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Choose the injection method per fault model:

   | Fault model | Method | Executed by flow |
   |---|---|---|
   | Process hang | `kill -STOP` on the process | `fusa-fault-injection-linux` |
   | Process crash | `kill -9` | `fusa-fault-injection-linux` |
   | Network delay or loss | `tc qdisc ... netem` on the bench Ethernet interface | `fusa-fault-injection-linux` |
   | CAN loss on bench bus | `ip link set <if> down` on the bench sender | `fusa-fault-injection-linux` |
   | CPU starvation | `stress-ng` | `fusa-fault-injection-linux` |
   | Firmware variable corruption, stuck task | debugger write or test-build fault hook | `fusa-fault-injection-mcu-gdb` |
   | Wire break, connector open | unplug on bench | hardware, manual |
   | Sensor out of range | signal generator or resistor substitution on bench | hardware, manual |

2. Write the expected detection mechanism and its location (file:line or component), the expected reaction, and the safe state from the safety goal.
3. Write `time_budget` from the TSR or safety goal FTTI, citing it. If none, `time_budget = open`.
4. Write the pass rule as a measurable statement: "relay coil drive low within `time_budget` of injection, measured on logic analyzer CH4; reset cause logged; no actuator current after the drop".
5. Write `entry_conditions` for every test: bench only, wheels off the ground or actuators uncoupled, actuator power behind the independent hardware emergency stop, stop chain verified the same day.

### Output
Fully specified fault rows.

### Quality Gate
- Every row has a method from the table, a pass rule with a named measurement channel or log, and entry conditions that state bench only and the independent emergency stop.
- Every `time_budget` cites a TSR or goal id, or is `open`.

---

## Phase 3: Prioritize and Emit

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Order by: ASIL of the linked goal (D first), then mechanisms that are the only barrier in a cut set, then everything else.
2. Group by `stack` so each execution flow receives only its rows.
3. Emit `fault_injection_plan` as JSON.

### Output
`fault_injection_plan`.

### Quality Gate
- `jq 'group_by(.stack)|map({s:.[0].stack,n:length})' fault_injection_plan.json` runs and the counts sum to the row total.
- `jq '[.[]|select(.entry_conditions|test("emergency stop")|not)]|length' fault_injection_plan.json` prints 0.

---

## Worked Example

Illustrative only.

```
{"fi_id":"FI-007","source_row":"SWF-031 (steering_angle_cmd, Late)",
 "fault_model":"process hang","injection_method":"kill -STOP <planner pid>",
 "injection_location":"compute board","stack":"linux-c",
 "expected_detection":"steer MCU RX timeout, can_rx.c:171",
 "expected_reaction":"STOP_REQ_N low, K_SW drops","safe_state":"SG-02 steering de-energized",
 "time_budget":"0.6 s FTTI of SG-02","measurement":"LA CH1 last 0x210 frame, CH4 K_SW coil",
 "pass_rule":"CH4 low within 0.6 s of CH1 last frame","priority":1,
 "entry_conditions":"bench only, wheels off ground, independent hardware emergency stop armed, stop chain verified today"}
```

---

## Exit Criteria

DONE when every claimed safety mechanism has at least one traced fault with method, expected detection and reaction, budget, measurable pass rule and bench entry conditions, ordered by priority and grouped by stack.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A mechanism has no fault that exercises it | **Adjust**: add a fault model that makes only that mechanism the barrier. |
| Phase 2 | No method can inject the fault safely | **Adjust**: use a test-build fault hook; record why. |
| Phase 2 | No time budget exists | **Adjust**: set `open` and record the question; still measure the time. |
| Phase 3 | Plan includes on-road or on-track injection | **Stop**: move it to the bench. |

**Do not:** plan injection on a moving vehicle, mark mechanisms "covered" without a fault that exercises them, or omit known gaps.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
