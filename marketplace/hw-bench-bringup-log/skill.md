# Hardware Bench Bring-Up Log

**One-line description:** Walks a person at the bench through the bring-up plan one step at a time, records each measured value against its expected value, judges PASS or FAIL, computes conversion efficiency from the measured power, and stops at the first failure with the owning flow named.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `bringup_plan` (object[], required): Ordered steps from `hw-bringup-plan`.

---

## Outputs

- `bringup_log` (object[]): Per step: the measured value with units, the instrument used, the expected value, PASS or FAIL, a timestamp, and for efficiency steps the computed efficiency at each load beside the prediction. Ends with the overall status and, on failure, the owning flow.

---

## Phase 1: Prepare

### Entry Criteria
- `bringup_plan` present.

### Actions
1. List the instruments the plan needs (bench supply with current limit, multimeter, loads, scope if any step needs one) and confirm each with the person before starting.
2. Record the board serial or label and the firmware state (unprogrammed at this stage).

### Output
Log header.

### Quality Gate
- Every instrument the plan calls for is confirmed present.

---

## Phase 2: Execute Steps

### Entry Criteria
- Header recorded.

### Actions
1. Present one step at a time: setup, probe points, what to read.
2. Record the reading the person reports, with units and instrument.
3. Judge it against the expected value and tolerance. Record PASS or FAIL.
4. On FAIL, stop. Name the flow that owns the circuit (power input to `pcb-power-input-review`, isolation to `pcb-isolation-review`, interlock to `pcb-interlock-fault-review`, placement or routing to the layout stage) and record the failing measurement for it.
5. Never advance past a step that has not passed. Never fill a reading the person did not take.

### Output
Step entries.

### Quality Gate
- Every recorded value was reported by the person, with units.
- No step after a FAIL is executed.

---

## Phase 3: Compute Efficiency

### Entry Criteria
- Efficiency steps passed their measurement entry.

### Actions
1. At each load point, compute input power (V x I) and each rail's output power, then efficiency = total output / input.
2. Record measured efficiency beside the datasheet prediction and the difference in percentage points.
3. Record total board dissipation (input minus output) at full load.

### Output
`bringup_log`.

### Quality Gate
- Efficiency is computed from recorded measurements at light, typical, and full load.
- Each efficiency figure sits beside its prediction.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Guide a person through bring-up step by step, record each measurement against ex, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when every plan step has a recorded measured value and PASS, or the log stops at the first FAIL with the owning flow named.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Instrument unavailable | **Adjust**: substitute an equivalent instrument and record it; if none, stop before that step. |
| Phase 2 | Reading ambiguous or out of instrument range | **Adjust**: repeat on the correct range; record both. |
| Phase 2 | Smoke, heat, or smell | **Stop**: remove power, record the step, route to the owning flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
