# SOTIF: Functional Insufficiencies and Triggering Conditions

**One-line description:** Identifies, per ISO 21448, the specification and performance insufficiencies of a perception or planning function and the triggering conditions in the operational design domain that activate them, sorts scenarios into the four SOTIF areas (known or unknown, hazardous or not) and links each triggering condition to the hazardous event it can cause.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `item_definition` (object, required): Output of `fusa-item-definition`.
- `hazardous_events` (object[], required): Output of `fusa-hara-hazardous-events`.
- `odd_description` (string, required): The operational design domain in the user's words: road or floor types, speed range, lighting, weather, traffic participants, geography. Path or text.
- `field_observations` (string, optional): Path to logs, disengagement notes or incident reports from earlier testing.

---

## Outputs

- `triggering_conditions` (object[]): `tc_id`, `odd_element`, `condition`, `insufficiency_type` (specification or performance), `affected_component` (sensor, perception model, planner, actuator model), `functional_insufficiency`, `resulting_behavior`, `linked_he`, `sotif_area` (1 known safe, 2 known hazardous, 3 unknown hazardous, 4 unknown safe), `evidence`.

---

## Phase 1: Decompose the ODD

### Entry Criteria
- `odd_description` names at least speed range and environment type.
- The function under analysis includes sensing, perception or decision making (pure actuator control is covered by ISO 26262 flows).

### Actions
1. Break the ODD into elements with values: scenery (road surface, markings, curbs, ramps), environment (illuminance range, rain, fog, sun angle, dust), dynamic elements (pedestrians, cyclists, other vehicles, animals, forklifts), and ego state (speed band, load, tire condition).
2. For each element, list the edge values and outliers that are still inside the ODD: low sun directly ahead, wet reflective floor, faded lane paint, a child-sized pedestrian, a person carrying a mirror-finish panel.
3. Mark elements the user said are outside the ODD; those need an ODD exit detection requirement instead of a triggering condition.

### Output
ODD element table with edge values.

### Quality Gate
- Every ODD element has at least one edge value.
- Every element marked outside the ODD has an "ODD exit detection" note.

---

## Phase 2: Insufficiencies and Triggering Conditions

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. For each component in the sense-plan-act chain, write its known limitations from datasheets and model reports: camera dynamic range, lidar returns on black or wet surfaces, radar multipath, detector classes absent from training data, planner assumptions about agent behavior.
2. Pair each limitation with ODD edge values that trigger it. Each pair is a triggering condition `TC-nnn`. Classify the insufficiency:

   | Type (ISO 21448 terms) | Example |
   |---|---|
   | Specification insufficiency | requirement never stated that the robot must detect persons lying on the floor |
   | Performance insufficiency | detector misses pedestrians under 1 m tall in the test data set |

3. Write `resulting_behavior` at the vehicle level (late braking, phantom braking, path through an undetected obstacle) and link the hazardous event id from `hazardous_events`. If no event matches, add a new hazard proposal for the HARA flow.
4. Mine `field_observations` if given: each disengagement or near miss becomes evidence for an existing TC or a new one.

### Output
Triggering condition rows linked to hazardous events.

### Quality Gate
- Every TC has `insufficiency_type`, `affected_component` and `linked_he` (or a hazard proposal).
- Every field observation in `field_observations` maps to a TC id.

---

## Phase 3: Sort into SOTIF Areas

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Assign each scenario to an area: Area 1 known and not hazardous, Area 2 known and hazardous, Area 3 unknown and hazardous, Area 4 unknown and not hazardous. By definition the team can list Area 1 and 2 items; Area 3 is addressed by the exploration methods in the test plan flow.
2. For every Area 2 TC, state the planned response from ISO 21448 clause 8 options: improve the function, restrict the ODD, add a warning or handover to a human, or accept with a validation argument.
3. Record evidence: test log, simulation run id or literature reference. A TC without evidence keeps `evidence = none`.
4. Emit `triggering_conditions` as JSON.

### Output
`triggering_conditions`.

### Quality Gate
- `jq '[.[]|select(.sotif_area==null)]|length' triggering_conditions.json` prints 0.
- Every Area 2 row has a planned response.

---

## Worked Example

Illustrative only. Closed-course cart with a camera-based pedestrian detector.

- Phase 1: environment element "sun elevation" edge value "low sun ahead on the west straight in late afternoon".
- Phase 2: `TC-004`: camera saturation under low sun ahead, performance insufficiency of the detector, resulting behavior "late or no braking for a person in the glare", linked `HE-002`.
- Phase 3: Area 2. Planned response: restrict the ODD to exclude the west straight within the user-defined sun elevation window until a second sensor is added; evidence: session log 2026-09-14, frames 18200 to 18420.

---

## Exit Criteria

DONE when every ODD element has been examined for triggering conditions, each condition is classified and linked to a hazardous event, and every known hazardous scenario has a planned response.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | ODD stated as "everywhere" | **Stop**: ask the user to bound speed, environment and participants. |
| Phase 2 | Component limitations unknown | **Adjust**: read the sensor datasheet and model evaluation report; record "unknown" and plan a characterization test. |
| Phase 2 | No hazardous event matches | **Return**: send a hazard proposal to `fusa-hara-hazardous-events`. |
| Phase 3 | Team wants to declare Area 3 empty | **Adjust**: Area 3 is never shown empty by listing; leave it to the exploration tests. |

**Do not:** treat SOTIF triggering conditions as random hardware faults, set validation targets in this flow, or claim the function is free of unknown hazards.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
