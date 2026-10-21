# Author an OpenSCENARIO XML Scenario

**One-line description:** Turns a written scenario description into a schema-valid ASAM OpenSCENARIO XML (.xosc) file with parameter declarations, an ego and target entities, an Init section, one Story with triggered events, and an explicit stop trigger.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `scenario_description` (object, required): Plain-language scenario: road and lane, ego start position and speed, each other actor's start and behavior, the trigger for each behavior, and the end condition. Example: "Target in the left lane cuts in when the longitudinal gap is below a parameter value."
- `opendrive_file` (string, required): Path to the ASAM OpenDRIVE (.xodr) road network, or a CARLA town name (for example "Town04") when running in CARLA.

---

## Outputs

- `xosc_file` (string): Path to the `.xosc` file that validates against the OpenSCENARIO XML schema version named in its FileHeader.

---

## Phase 1: Pin the Standard Version and Road Positions

### Entry Criteria
- `scenario_description` names every actor, trigger and end condition.

### Actions
1. Choose the OpenSCENARIO XML version your runner supports. Check: CARLA scenario_runner's `Docs/openscenario_support.md` lists supported elements; esmini's README lists the supported version. Record the version (for example 1.2) and download the matching `OpenSCENARIO.xsd` from ASAM.
2. Read lane ids from the road: open the `.xodr` in a viewer (esmini `odrviewer --odr road.xodr` or the CARLA map) and record the road id, lane id (negative is right of the reference line, positive is left) and s coordinate for each start position.
3. List every number in the description that will vary between test cases (speeds, gaps, trigger distances). Each becomes a `ParameterDeclaration`.
4. Any number the description does not give is an open question, not a default.

### Output
Version, lane positions and parameter list.

### Quality Gate
- The schema file is on disk and its version matches the runner's documented support.
- Every start position has road id, lane id and s.

---

## Phase 2: Write the XML

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Write the skeleton in this order (the schema enforces it):
   `OpenSCENARIO` > `FileHeader` (revMajor, revMinor, date, description, author) > `ParameterDeclarations` > `CatalogLocations` > `RoadNetwork` (`LogicFile filepath`) > `Entities` > `Storyboard`.
2. Entities: one `ScenarioObject` per actor with a `Vehicle` (name, vehicleCategory="car", `BoundingBox`, `Performance` maxSpeed, maxAcceleration, maxDeceleration, `Axles`, `Properties`). For CARLA, the ego's `ScenarioObject name` and properties must follow scenario_runner's ego convention in its docs (commonly name "hero" with property `type` = `ego_vehicle`); check the doc for your version.
3. Init: for each actor, `Private entityRef` with `TeleportAction` > `Position` > `LanePosition roadId laneId s offset` and a `LongitudinalAction` > `SpeedAction` with `SpeedActionDynamics dynamicsShape="step"` and `AbsoluteTargetSpeed value="$EgoSpeed"`.
4. Story: `Story` > `Act` > `ManeuverGroup maximumExecutionCount="1"` with `Actors` > `EntityRef` > `Maneuver` > `Event priority=...` > `Action` (for a cut-in: `LateralAction` > `LaneChangeAction` with `LaneChangeActionDynamics dynamicsDimension="time"` and `RelativeTargetLane`) > `StartTrigger` > `ConditionGroup` > `Condition` with `ByEntityCondition` (for example `RelativeDistanceCondition` or `TimeHeadwayCondition`) using a `$Parameter`.
5. Event priority value names differ by version: check the schema enumeration (`grep -A6 'name="Priority"' OpenSCENARIO.xsd`) and use a listed value.
6. Act `StartTrigger`: a `SimulationTimeCondition value="0" rule="greaterThan"`.
7. `StopTrigger` on the Storyboard: an end condition from the description (for example `SimulationTimeCondition` with a `$MaxTime` parameter, or `ReachPositionCondition`). Every scenario must stop on its own.

### Output
Draft `.xosc`.

### Quality Gate
- Every `$Name` used appears in `ParameterDeclarations` (`grep -o '\$[A-Za-z]*' file.xosc | sort -u` compared with declared names).
- The Storyboard has a `StopTrigger`.

---

## Phase 3: Validate

### Entry Criteria
- Draft written.

### Actions
1. Schema check: `xmllint --noout --schema OpenSCENARIO.xsd scenarios/cut_in.xosc`. Expected output: `scenarios/cut_in.xosc validates`.
2. For each error, xmllint prints the line and the expected element; fix that line only and rerun. Do not reorder unrelated elements.
3. Load check in a runner (next flow, `vsim-esmini-scenario-check`, or scenario_runner) to catch semantic errors the schema cannot, such as a lane id that does not exist.

### Output
`xosc_file`.

### Quality Gate
- `xmllint` prints `validates`.

---

## Worked Example

Illustrative. Description: ego in lane -1 of road 0 at s=50, speed `$EgoSpeed`; target in lane -2 at s=70, same speed; target changes to lane -1 over `$LcTime` seconds when relative distance is below `$TriggerGap`; stop at `$MaxTime`.
```
$ xmllint --noout --schema OpenSCENARIO_1_2.xsd scenarios/cut_in.xosc
scenarios/cut_in.xosc:41: element LanePosition: Schemas validity error : Element 'LanePosition': The attribute 'roadId' is required but missing.
$ # fix line 41, rerun
scenarios/cut_in.xosc validates
```

---

## Exit Criteria

DONE when the `.xosc` validates against the chosen schema, every parameter is declared, and the storyboard has its own stop trigger.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Description lacks a trigger or end condition | **Stop**: ask for it; a scenario with no end runs forever in CI. |
| Phase 1 | Runner does not support the version | **Adjust**: write to the highest version the runner documents. |
| Phase 3 | Schema error | **Adjust**: fix the reported line only; rerun xmllint. |
| Phase 3 | Valid schema but runner rejects it | **Return**: to Phase 2 with the runner's message. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
