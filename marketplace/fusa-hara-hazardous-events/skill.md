# HARA Step 1: Hazardous Events from Malfunction Guidewords

**One-line description:** Builds the list of hazardous events for an item by applying HAZOP-style malfunction guidewords to every function and pairing each resulting vehicle-level hazard with each relevant operational situation, as the input to ASIL rating in ISO 26262-3 clause 6.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `item_definition` (object, required): Output of `fusa-item-definition`.
- `operational_situations` (string[], optional): User-supplied situations (for example "reversing in a depot at walking speed", "straight track at maximum test speed with a pedestrian marshal nearby"). When absent, Phase 2 builds them from the item assumptions.

---

## Outputs

- `hazardous_events` (object[]): One row per hazardous event: `he_id`, `function_id`, `guideword`, `malfunction`, `vehicle_hazard`, `situation_id`, `situation_text`, `persons_at_risk`.

---

## Phase 1: Malfunctions per Function

### Entry Criteria
- `item_definition.functions` has at least one entry.

### Actions
1. For each function, apply every guideword in this table and write the malfunctioning behavior at the item output:

   | Guideword | Meaning for an actuator command |
   |---|---|
   | Loss of function | command not issued when needed |
   | Unintended function | command issued when not requested |
   | More | value larger than intended |
   | Less | value smaller than intended |
   | Wrong direction | sign inverted |
   | Too early | issued before intended time |
   | Too late | issued after the needed time |
   | Stuck | value frozen at last value |
   | Intermittent | toggling on and off |

2. Write the malfunction at the item boundary ("steering angle command larger than requested"), not as a cause ("CAN bit flip"). Causes belong in FMEA and FTA flows.
3. Translate each malfunction to a vehicle-level hazard ("unintended lateral motion", "unintended acceleration", "loss of deceleration", "unintended arm motion toward the operator"). Merge malfunctions that produce the same hazard but keep the guideword list on the row.
4. Mark a guideword `not applicable` only with a one-line reason (for example "brake actuator has no direction").

### Output
Function by guideword table with vehicle-level hazards.

### Quality Gate
- Row count before merging equals (number of functions) x (number of guidewords).
- Every `not applicable` cell has a written reason.
- No hazard text names a component cause (search for "bit flip", "short", "crash of process": zero hits in the hazard column).

---

## Phase 2: Operational Situations

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. If `operational_situations` is given, number them `OS-01`, `OS-02` and so on. Otherwise derive them from `item_definition.assumptions` and `operating_modes` by combining: location type, speed band (use the user's own bands), nearby persons (none, operator, bystander), surface, and mode.
2. Keep situations specific enough to rate exposure later. "Driving" is too broad; "turning at the track hairpin at the posted test speed with a marshal standing at the apex" is the right size.
3. Every situation that requires a number the user did not give gets an entry in the item open questions; do not invent speeds or distances.

### Output
Numbered situation list.

### Quality Gate
- Each situation names a location, a speed band or "stationary", and who is nearby.
- Every number in the list appears in `item_definition` or `operational_situations`.

---

## Phase 3: Pair Hazards with Situations

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. For each vehicle-level hazard, list every situation where it could harm a person. Each pair is one hazardous event `HE-nnn`.
2. Fill `persons_at_risk`: occupant, safety driver, bystander, operator, other road user.
3. Drop a pair only when no person can be present in that situation, and write why in a `dropped` list kept beside the output.
4. Emit `hazardous_events` as JSON.

### Output
`hazardous_events`.

### Quality Gate
- `jq length hazardous_events.json` equals the count of kept pairs.
- Every hazard from Phase 1 appears in at least one event or in the `dropped` list.
- Every row has non-empty `persons_at_risk`.

---

## Worked Example

Illustrative only. Function `F2 command steering angle`.

- Phase 1: guideword More gives "steering angle command larger than requested", hazard "unintended lateral motion". Stuck gives "steering command frozen", hazard "vehicle does not follow the track curve".
- Phase 2: `OS-03 closed-course hairpin, user test speed band 2, marshal at apex`.
- Phase 3: `HE-007: F2, More, unintended lateral motion, OS-03, persons_at_risk: [safety driver, marshal]`.

---

## Exit Criteria

DONE when every function and guideword combination is either a hazardous event row paired with situations or carries a written reason for exclusion.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Function list empty | **Return**: rerun `fusa-item-definition`. |
| Phase 1 | Model writes causes instead of malfunctions | **Adjust**: rewrite each row at the item output, move causes to a note for `fusa-dfmea-worksheet`. |
| Phase 2 | Situations need speeds the user never gave | **Adjust**: add open questions and use named bands ("band 1", "band 2") without numbers. |
| Phase 3 | Event count explodes past what the team can rate | **Adjust**: merge situations with identical exposure and persons; never delete hazards to shrink the list. |

**Do not:** skip guidewords that "seem unlikely" (likelihood is rated later through exposure), or rate anything in this flow.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
