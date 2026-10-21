# PCB Interlock Fault Review

**One-line description:** Enumerates every single fault on each interlock and emergency stop and traces the circuit to confirm each one ends in the safe state or a latched detection, with software unable to block a stop.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `skidl_source` (string, required): Path to the SKiDL design file.
- `bom` (object[], required): BOM with datasheet URLs.
- `critical_circuits` (object[], required): Critical circuits; this flow covers interlocks, emergency stops, and any circuit that grants or removes actuator power.

---

## Outputs

- `interlock_findings` (object[]): Per interlock: the fault list, the traced result of each fault, structural checks, and PASS or FAIL with the exact topology change for each FAIL.

---

## Phase 1: Structural Checks

### Entry Criteria
- `critical_circuits` contains at least one interlock or actuator power path. If none, return an empty list with a note.

### Actions
1. Locate the interlock subcircuit in the SKiDL source and list its parts and nets.
2. Confirm the stop is normally closed and energize to run: power must actively hold the run state, so removing it stops.
3. Confirm no processor pin sits in series with the stop's ability to remove actuator power. Software may request a stop; it must have no path that prevents one.
4. Confirm restart after a stop requires a manual reset, so the actuator never re-energizes on its own.
5. Where a relay switches the actuator, check for a force-guided relay with its auxiliary contact monitored, so a welded contact is detected.

### Output
Structural entries in `interlock_findings`.

### Quality Gate
- Each of the four structural properties (normally closed, energize to run, no software block, manual reset) is checked with the nets that prove it.

---

## Phase 2: Single-Fault Trace

### Entry Criteria
- Structural checks done.

### Actions
1. Enumerate single faults: loss of board power, loss of host power, host processor hung with outputs frozen high, host output shorted high, each loop wire open, each loop wire shorted to ground, relay contact welded, relay coil open.
2. For each fault, trace the circuit and state the resulting actuator state.
3. Each fault must end with the actuator de-energized, or be detected and latched before the next demand. Any fault ending energized and undetected is a FAIL with a topology fix (e.g., add a redundant series contact, monitor the auxiliary contact, move the processor out of the series path).

### Output
Fault entries in `interlock_findings`.

### Quality Gate
- Every listed fault has a traced result.
- Zero faults end energized and undetected.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Trace every single fault on each interlock and emergency stop to confirm it ends, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when every interlock passes all structural checks and every single fault ends safe or latched. This review applies ISO 13849-1 single-fault reasoning and does not certify a performance level.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Actuator path has no stop at all | **FAIL**: require a hardware emergency stop. |
| Phase 1 | Processor pin in series with stop | **FAIL**: required change moves it to a request-only role. |
| Phase 2 | Fault ends energized | **FAIL**: name the fault and the topology fix. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
