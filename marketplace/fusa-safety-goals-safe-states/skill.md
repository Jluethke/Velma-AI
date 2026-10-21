# Safety Goals, Safe States and Fault Tolerant Time Intervals

**One-line description:** Turns the rated HARA table into safety goals, one per distinct hazard, each inheriting the highest ASIL of the events it covers, with a defined safe state that the vehicle or robot can actually reach and a fault tolerant time interval that is either derived from a stated physical argument or listed as an open question.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `hara_table` (object[], required): Output of `fusa-hara-asil-rating`.
- `item_definition` (object, required): Output of `fusa-item-definition`; supplies modes and assumptions.

---

## Outputs

- `safety_goals` (object[]): `sg_id`, `text`, `asil`, `covered_events` (list of `he_id`), `safe_state`, `safe_state_reachable_by` (mechanism), `ftti` (value with derivation, or `open`), `emergency_operation` (none or description), `open_questions`.

---

## Phase 1: Group Events into Goals

### Entry Criteria
- `hara_table` has no row with an empty `asil`.

### Actions
1. Group rows by vehicle-level hazard. Each group becomes one safety goal candidate.
2. Write each goal as a prevention statement at the item level: "Avoid unintended lateral motion caused by the item" or "Avoid loss of deceleration request when braking is needed". Do not write a technical solution into the goal ("use a dual-core lockstep MCU" is a requirement, not a goal).
3. Set the goal's `asil` to the highest ASIL among `covered_events`. Never take an average.
4. Events rated QM keep a goal only when the team wants it tracked; mark those `asil = QM`.

### Output
Draft goals with ASIL and covered events.

### Quality Gate
- Every `he_id` with ASIL A to D appears in exactly one goal's `covered_events`.
- Each goal's `asil` equals the maximum ASIL of its events (check with `jq`).
- No goal text contains a component name from the item boundary list.

---

## Phase 2: Safe State per Goal

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. For each goal, choose the safe state from this table and confirm it is physically reachable from every operating mode:

   | Platform and hazard | Typical safe state | Reached by |
   |---|---|---|
   | Low-speed vehicle, unintended acceleration | propulsion torque removed, service brake applied, vehicle stationary | independent stop chain removing drive power, brake applied by spring or by the base vehicle's own brake |
   | Vehicle, unintended steering | steering actuator de-energized so the human or mechanical caster returns control | power removed from the steering motor driver by the stop chain |
   | Mobile robot | stop category 0 or 1 per IEC 60204-1, drives de-energized | safety relay opening drive power or Safe Torque Off input |
   | Arm near people | protective stop per ISO 10218-1 | safety controller removing joint power, brakes engaged |

2. Reject a safe state that depends on the same software that might have failed. "The planner commands zero speed" is not a safe state mechanism; "the stop chain removes drive power" is.
3. If no state is safe while moving at speed (for example a highway vehicle with steering removed), record that the item needs emergency operation, describe it, and add it to `open_questions`. Do not pretend "stop instantly" is possible.
4. Braking must never be the thing the safe state removes. If a safe state cuts power to a brake actuator, the brake must be spring-applied or the base vehicle brake must remain under human control; state which.

### Output
Safe state and mechanism per goal.

### Quality Gate
- Every goal has `safe_state` and `safe_state_reachable_by` filled.
- No `safe_state_reachable_by` value names only a software component.
- Every goal whose safe state touches braking states how braking stays available.

---

## Phase 3: Fault Tolerant Time Interval

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. For each goal, derive the FTTI (time from fault occurrence to possible hazardous event, ISO 26262-1 definition) only from a stated physical argument, for example: lateral offset available before leaving the lane divided by worst-case lateral speed under a full-scale steering error. Use only distances and speeds the user supplied or measured.
2. Show the arithmetic in the `ftti` field. If any term is missing, set `ftti = open` and add the missing term to `open_questions`.
3. Record that the fault detection time plus fault reaction time must fit inside the FTTI; later watchdog and fault injection flows measure both.
4. Emit `safety_goals` as JSON.

### Output
`safety_goals`.

### Quality Gate
- Every `ftti` is either `open` or contains an arithmetic expression whose inputs appear in `item_definition` or user-supplied measurements.
- `jq '[.[]|select(.ftti=="open")]|length' safety_goals.json` equals the number of FTTI entries in `open_questions`.

---

## Worked Example

Illustrative only.

- Phase 1: `SG-02 Avoid unintended lateral motion caused by the item`, covers HE-007 (B) and HE-009 (A), ASIL B.
- Phase 2: safe state "steering motor driver de-energized, safety driver steers manually"; reached by "stop chain contactor K2 opening driver supply".
- Phase 3: user measured 0.9 m of clearance to the track edge and logged a worst-case lateral speed of 1.5 m/s for a full-scale command step, so FTTI = 0.9 / 1.5 = 0.6 s. The goal records "detection plus reaction must be under 0.6 s".

---

## Exit Criteria

DONE when every rated hazard is covered by a goal with the highest ASIL of its events, a safe state reachable by a mechanism independent of the failing software, and an FTTI that is derived or listed as open.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Goal text describes a solution | **Adjust**: move the solution to `fusa-requirements-decomposition`; rewrite the goal as prevention. |
| Phase 2 | Safe state relies on the software being analyzed | **Adjust**: pick a hardware-reached safe state or flag the need for one. |
| Phase 2 | Safe state would disable braking | **Stop**: redesign; braking stays available in every safe state. |
| Phase 3 | User asks for a "typical" FTTI | **Return**: an FTTI comes from this item's physics; record `open` until measured. |

**Do not:** copy FTTI values from other programs, set every goal to ASIL D "to be safe" without the HARA supporting it, or write goals per component.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
