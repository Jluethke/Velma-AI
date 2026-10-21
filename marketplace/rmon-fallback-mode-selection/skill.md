# Fallback Mode Selection

**One-line description:** Chooses, per hazard, between a fail-safe fallback (remove energy, stop, de-energize) and a fail-operational fallback (keep a degraded function running until a minimal risk condition is reached), using an explicit decision table and the fault tolerant time interval, with braking and emergency stop kept outside any software gate.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `monitor_scope` (object, required): Output of `rmon-scope-supervised-component`.
- `simplex_design` (object, required): Output of `rmon-simplex-architecture-design`.
- `ftti_ms` (number, required): Fault tolerant time interval per hazard in milliseconds, from the hazard analysis (ISO 26262-1 defines FTTI). Supply as a map `hazard_id -> ms`, or one value that applies to all.

---

## Outputs

- `fallback_strategy` (object[]): One row per hazard: `hazard_id`, `mode` (`fail-safe` or `fail-operational`), `safe_state` or `minimal_risk_condition`, `transition_actions` (ordered), `time_budget_ms` (detection, reaction, split of `ftti_ms`), `redundancy_needed` (bool and what), `brake_path_note`.

---

## Phase 1: Classify Each Hazard

### Entry Criteria
- Every `hazard_id` in `monitor_scope.hazard_map` has an `ftti_ms` value. If any is missing, list it and **Stop** for that hazard.

### Actions
1. For each hazard, answer three questions and write the answers in the row:
   - Q1: Is there a state reachable by removing power or commanding stop that is itself safe (no new hazard)?
   - Q2: Can that state be reached within `ftti_ms` minus the detection time?
   - Q3: Does stopping in place create a new hazard (for example stopping in a live traffic lane, a drone losing lift, a robot dropping a load)?
2. Apply this table exactly:

   | Q1 | Q2 | Q3 | Mode |
   |---|---|---|---|
   | yes | yes | no | `fail-safe` |
   | yes | no | any | `fail-operational` until the safe state is reachable, then fail-safe |
   | yes | yes | yes | `fail-operational` to a minimal risk condition (SAE J3016 term) |
   | no | any | any | `fail-operational` |

3. For `fail-operational` rows, set `redundancy_needed = true` and name what must keep working (sensor, compute, actuator channel, power). A single-channel system cannot be fail-operational for a fault in that channel.

### Output
Classified hazard rows.

### Quality Gate
- Every row has Q1, Q2, Q3 answered as `yes` or `no` and a `mode` matching the table.
- Every `fail-operational` row names the redundant element or is listed as an open item.

---

## Phase 2: Define Transitions and Time Budget

### Entry Criteria
- All hazards classified.

### Actions
1. Write `transition_actions` in order, for example: "1. latch decision module to safety controller; 2. request stop profile; 3. drop propulsion enable after zero speed is measured".
2. Split `ftti_ms` as `detection_ms + reaction_ms <= ftti_ms`. `detection_ms` is the monitor's worst-case detection time (sample period plus `max_age_ms` plus processing); `reaction_ms` is the time from trip to safe state or minimal risk condition. If either is unknown, write `open` and keep it for `rmon-detection-latency-measurement` to measure.
3. Add `brake_path_note` on every row: "Braking and emergency stop act directly; no software in this fallback can delay, gate or veto them."
4. If a transition action would hold the brakes off (for example to "smooth" a stop), delete that action. Braking requests are only ever added, never withheld.

### Output
`fallback_strategy` rows with transitions and budgets.

### Quality Gate
- For every row with numeric `detection_ms` and `reaction_ms`, their sum is less than or equal to `ftti_ms` (check with a one-line script).
- `rg -n -i "delay brak|gate brak|hold.*brake|inhibit.*brake" fallback_strategy.json` returns nothing.

---

## Worked Example

Illustrative only. H-01 "collision with person", `ftti_ms` 400 from the HARA. Q1 yes (zero speed is safe in a closed warehouse aisle), Q2 to be measured, Q3 no. Mode `fail-safe`. Transitions: latch to safety controller, constant-deceleration stop, remove motor enable at measured zero speed. Budget: `detection_ms` open, `reaction_ms` open, constraint `detection_ms + reaction_ms <= 400`.

H-05 "loss of lift" on a multirotor: Q1 no, mode `fail-operational`, redundancy: second flight controller and a separate power rail; minimal risk condition: controlled descent.

---

## Exit Criteria

DONE when every hazard has a table-derived mode, ordered transitions, a time budget that fits its FTTI or is marked open, and a brake path note.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ftti_ms` missing for a hazard | **Stop** for that hazard; return to the hazard analysis owner. |
| Phase 1 | Fail-operational needed but no redundancy exists | **Return**: record as an architecture gap; do not relabel it fail-safe. |
| Phase 2 | Budget sum exceeds FTTI | **Return**: to `rmon-simplex-architecture-design` to shorten detection or reaction; do not stretch the FTTI. |

**Do not:** pick fail-safe because it is easier to implement, borrow FTTI values from another product, or describe any software step that withholds braking.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
