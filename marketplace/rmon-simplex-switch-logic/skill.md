# Simplex Decision Switch Logic

**One-line description:** Specifies the decision module as a small latching state machine (ADVANCED, SAFETY, SAFE_STOPPED) with a complete transition table, a manual-only return path, and table-driven test vectors that any implementation language must pass, with braking and emergency stop wired outside the switch.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `simplex_design` (object, required): Output of `rmon-simplex-architecture-design`.
- `fallback_strategy` (object[], required): Output of `rmon-fallback-mode-selection`.
- `temporal_properties` (object[], required): Output of `rmon-temporal-property-spec`.

---

## Outputs

- `switch_state_machine` (object): `states`, `events`, `transition_table` (every state by every event), `latching_rules`, `return_conditions`, `outputs_per_state`.
- `switch_test_vectors` (object[]): Rows `{id, start_state, event_sequence, expected_state_sequence, expected_output_sequence}` covering every cell of the transition table.

---

## Phase 1: Define States and Events

### Entry Criteria
- `simplex_design.recoverable_region` has a defined test (not `open`).

### Actions
1. Use exactly these states unless the fallback strategy requires more:
   - `ADVANCED`: advanced controller command passes to actuators.
   - `SAFETY`: safety controller command passes; advanced command ignored.
   - `SAFE_STOPPED`: safe state or minimal risk condition reached; outputs held at the safe values.
2. Define events from monitor outputs only:
   - `REGION_EXIT_PREDICTED` (recoverable region test fails)
   - `PROPERTY_VIOLATED` (any `temporal_properties` reliableness below zero)
   - `INPUT_STALE` (staleness checker trip)
   - `MONITOR_FAULT` (monitor self-check fails, including its own watchdog)
   - `SAFE_REACHED` (safe state measured, for example zero speed measured from a sensor)
   - `OPERATOR_RESET` (an explicit human action on a physical or authenticated control)
3. There is no event that lets the advanced controller request its own return.

### Output
State and event lists.

### Quality Gate
- Every event comes from a monitor output or a physical operator action; none comes from the advanced controller.

---

## Phase 2: Fill the Transition Table

### Entry Criteria
- States and events defined.

### Actions
1. Fill every cell (3 states by 6 events = 18 cells). Required rules:

   | From | Event | To |
   |---|---|---|
   | ADVANCED | REGION_EXIT_PREDICTED, PROPERTY_VIOLATED, INPUT_STALE, MONITOR_FAULT | SAFETY |
   | ADVANCED | SAFE_REACHED, OPERATOR_RESET | ADVANCED |
   | SAFETY | any trip event | SAFETY (latched) |
   | SAFETY | SAFE_REACHED | SAFE_STOPPED |
   | SAFETY | OPERATOR_RESET | SAFETY (no return while moving toward safe state) |
   | SAFE_STOPPED | OPERATOR_RESET with all checks passing for the whole current sample | ADVANCED |
   | SAFE_STOPPED | any trip event | SAFE_STOPPED |
   | SAFE_STOPPED | SAFE_REACHED | SAFE_STOPPED |

2. Latching: once in `SAFETY`, no automatic return. Automatic return invites chattering between controllers at the region boundary; a manual reset from a stopped state removes it.
3. Outputs per state: in `SAFETY` and `SAFE_STOPPED`, the advanced command is discarded, not blended.
4. Write in the spec: "Braking and emergency stop are wired to the actuators directly. This state machine can add a brake request in any state but cannot delay, remove or block one."

### Output
`switch_state_machine`.

### Quality Gate
- The table has 18 filled cells: `python -c "import json; t=json.load(open('switch_state_machine.json'))['transition_table']; print(len(t))"` prints 18.
- No cell maps `SAFETY` to `ADVANCED`.

---

## Phase 3: Write Test Vectors

### Entry Criteria
- Transition table complete.

### Actions
1. Write one vector per cell (18) plus these sequences:
   - Trip, then trip clears by itself: state stays `SAFETY`.
   - Trip, `SAFE_REACHED`, `OPERATOR_RESET` while a property is still violated: state stays `SAFE_STOPPED`.
   - Two trip events in the same sample: one transition, no error.
2. Store vectors as JSON Lines in `switch_test_vectors.jsonl`. The Python and C++ fault injection flows load this file directly.

### Output
`switch_test_vectors`.

### Quality Gate
- `wc -l switch_test_vectors.jsonl` prints at least 21.
- Every transition table cell ID appears in at least one vector: check with a short script that collects `(start_state, first_event)` pairs.

---

## Worked Example

Illustrative only.
```
{"id":"V07","start_state":"ADVANCED","event_sequence":["INPUT_STALE","SAFE_REACHED","OPERATOR_RESET"],
 "expected_state_sequence":["SAFETY","SAFE_STOPPED","ADVANCED"],
 "expected_output_sequence":["cmd_s","safe_hold","cmd_a"]}
{"id":"V19","start_state":"ADVANCED","event_sequence":["PROPERTY_VIOLATED","OPERATOR_RESET"],
 "expected_state_sequence":["SAFETY","SAFETY"],"expected_output_sequence":["cmd_s","cmd_s"]}
```

---

## Exit Criteria

DONE when all 18 cells are defined, return is manual-only from a stopped state, braking is outside the switch, and test vectors cover every cell.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Recoverable region test still `open` | **Return**: to `rmon-simplex-architecture-design`. |
| Phase 2 | Requirement demands automatic return to the advanced controller | **Stop**: record as a design conflict; automatic return needs its own hazard analysis and hysteresis bounds from requirements. |
| Phase 3 | A cell has no vector | **Retry**: add the vector before handing off. |

**Do not:** blend advanced and safety commands, add a timer that returns automatically, or let any state hold off braking.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
