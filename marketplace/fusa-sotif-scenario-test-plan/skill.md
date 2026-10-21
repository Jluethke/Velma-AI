# SOTIF: Scenario Test Plan for Known and Unknown Hazardous Scenarios

**One-line description:** Turns each triggering condition into a parameterized test scenario with pass criteria, chooses the test venue (log replay, simulation, closed-course track) per scenario, and adds exploration runs aimed at unknown hazardous scenarios, with every acceptance criterion and validation target taken from the user or recorded as an open question.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `triggering_conditions` (object[], required): Output of `fusa-sotif-triggering-conditions`.
- `acceptance_criteria` (string, optional): The team's stated acceptance criteria and validation targets (for example a maximum rate of a hazardous behavior per distance or hours, with its derivation). ISO 21448 requires these to be defined and argued; this flow never chooses them.
- `test_venues` (string[], optional): Venues the team has: `log-replay`, `simulation` (with the simulator name), `closed-course`.

---

## Outputs

- `sotif_test_plan` (object[]): `scenario_id`, `tc_id`, `parameters` (name, range, sampling), `venue`, `pass_criterion`, `measurement`, `entry_conditions`, `exploration` (true or false), `open_questions`.

---

## Phase 1: Parameterize Scenarios

### Entry Criteria
- Every Area 2 triggering condition has a planned response.

### Actions
1. For each Area 2 triggering condition, define a logical scenario: the actors, the road or floor layout, and the parameters that vary (ego speed band, pedestrian crossing speed, sun elevation, rain intensity). Write each parameter's range from the ODD; do not widen it beyond the ODD without saying so.
2. Choose sampling per parameter: boundary values plus interior points. Write the exact list, for example `ego_speed_band: [band1_min, band1_max, midpoint]`.
3. For scenarios already seen in logs, add a `log-replay` variant that runs the recorded sensor data through the current software build, for example `ros2 bag play <bag_dir> --rate 1.0` with the perception stack listening and a recorder capturing outputs (`ros2 bag record -o replay_out /detections /planner/trajectory`).

### Output
Logical scenarios with parameter lists.

### Quality Gate
- Every Area 2 TC has at least one scenario.
- Every parameter range is inside the ODD or carries a note "outside ODD by design".

---

## Phase 2: Venue, Pass Criteria and Safety Entry Conditions

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Pick the venue with this rule table, using only venues listed in `test_venues` (when `test_venues` is absent, ask the user which venues exist before assigning any):

   | Scenario involves | Venue order |
   |---|---|
   | A person or animal in the path | log replay, then simulation, then closed course with a soft target only; never a human in the path |
   | Weather or lighting | log replay of recorded conditions, then simulation |
   | Ego dynamics (braking distance, steering) | closed course behind an independent hardware emergency stop |

2. Write the pass criterion as a measurable statement linked to `acceptance_criteria`: "detection of the soft target at or beyond the stopping distance plus margin defined in Q3". If `acceptance_criteria` is absent, write the criterion with a named placeholder and add an open question.
3. For every closed-course scenario, write `entry_conditions`: closed course, trained safety driver or remote operator holding the independent hardware emergency stop, stop chain tested the same day (`fusa-estop-bench-verification` record id), soft targets only, track clear of people inside the run area.
4. Name the measurement: logged topic or CAN signal, time reference, and the tool used to compute the result (`ros2 bag` plus a script, `cantools` decode of the CAN log).

### Output
Venue, pass criterion and entry conditions per scenario.

### Quality Gate
- No scenario places a person in the vehicle path (search `parameters` and actors for "person" with venue `closed-course`; each hit uses a soft target).
- Every closed-course scenario lists the independent emergency stop and the same-day stop chain test.
- Every pass criterion references `acceptance_criteria` or an open question.

---

## Phase 3: Exploration for Unknown Scenarios

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Add exploration runs aimed at Area 3: randomized parameter combinations inside the ODD in simulation, long-duration log replay of all recorded data with automatic flagging of hard braking, near misses or perception dropouts, and free driving on the closed course in new layouts.
2. Write the trigger rules that flag a run for review, for example "planner deceleration request above the comfort limit defined by the user", "track lost for more than N frames" with N from the user.
3. Every flagged event becomes either a new triggering condition (sent back to `fusa-sotif-triggering-conditions`) or a documented false alarm.
4. Emit `sotif_test_plan` as JSON.

### Output
`sotif_test_plan`.

### Quality Gate
- At least one row has `exploration = true`.
- Every flag rule threshold names its source (user input or open question).

---

## Worked Example

Illustrative only. `TC-004` low sun ahead.

- Phase 1: `SC-004a`: ego speed band 1 and 2; sun elevation from recorded sessions; soft pedestrian target crossing at walking speed.
- Phase 2: venue order: log replay of 2026-09-14 session (`ros2 bag play bags/0914_west --rate 1.0`), then simulation with matching sun angle. Pass criterion: "target detected at or beyond the distance in Q3". Open question Q3: stopping distance plus margin not yet measured.
- Phase 3: exploration: replay all 41 recorded sessions and flag frames where the detector confidence for any tracked person drops to zero for more than N frames (N from user).

---

## Exit Criteria

DONE when every known hazardous triggering condition has a parameterized scenario with venue, measurable pass criterion and safety entry conditions, and exploration runs are planned for unknown scenarios.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Parameter range unknown | **Adjust**: record an open question; use the ODD bound as the range. |
| Phase 2 | No independent emergency stop available | **Stop**: closed-course scenarios cannot run; keep log replay and simulation only. |
| Phase 2 | User asks for a typical validation target | **Return**: targets come from the team's own argument; record an open question. |
| Phase 3 | Flagged events exceed review capacity | **Adjust**: tighten flag rules with the user; never delete flagged events unreviewed. |

**Do not:** test with a person in the vehicle path, set validation targets on the user's behalf, or report the function as validated from known scenarios alone.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
