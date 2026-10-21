# Item Definition for a Vehicle or Robot Function

**One-line description:** Writes the item definition that every later safety activity depends on: the item boundary, its functions, its interfaces to other systems, its operating modes and the assumptions it makes about its environment, following the structure of ISO 26262-3 clause 5.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `system_description` (string, required): Plain text or a path to a document describing what the vehicle or robot function does, which actuators it drives (propulsion, steering, braking, arm joints) and which sensors it reads.
- `platform_class` (string, required): One of `road-vehicle`, `closed-course-vehicle`, `mobile-robot`, `industrial-arm`. Selects which standard family the later flows cite.
- `known_interfaces` (string[], optional): Names of buses, topics, wires and power rails the user already knows cross the item boundary.

---

## Outputs

- `item_definition` (object): `item_id`, `boundary` (inside and outside lists), `functions` (id, verb phrase, actuator touched), `interfaces` (id, direction, medium, signal list), `operating_modes`, `assumptions` (id, text, owner), `standard_family`, `open_questions`.

---

## Phase 1: Draw the Boundary

### Entry Criteria
- `system_description` is non-empty and names at least one actuator or one output that can cause physical motion or force.
- `platform_class` is one of the four allowed values.

### Actions
1. List every hardware and software element mentioned in `system_description` in one column.
2. Mark each element `inside` or `outside` with this rule: an element is inside if a change to it is under this project's control and it contributes to the function. Everything else (base vehicle brakes, a bought motor controller with closed firmware, the human operator, the road) is outside.
3. Give the item a short id, for example `ITEM-DBW-01`.
4. Set `standard_family` from this table:

   | `platform_class` | Standard family cited by later flows |
   |---|---|
   | `road-vehicle` | ISO 26262 (functional safety), ISO 21448 (SOTIF) |
   | `closed-course-vehicle` | ISO 26262 and ISO 21448 used as engineering method only |
   | `mobile-robot` | ISO 13849-1, IEC 61508; ISO 26262 HARA concepts as method |
   | `industrial-arm` | ISO 10218-1/-2, ISO 13849-1, IEC 62061 |

5. Do not write "compliant with" or "certified to" anywhere. The item definition describes engineering intent only.

### Output
Boundary table with inside and outside lists and `standard_family`.

### Quality Gate
- Every element named in `system_description` appears exactly once in either the inside or the outside list.
- `standard_family` matches the table row for `platform_class`.
- A text search of the draft for "compliant" and "certified" returns zero hits.

---

## Phase 2: Functions, Interfaces and Modes

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Write each function as a verb phrase with one actuator or output, for example `F1: command longitudinal acceleration through the throttle-by-wire input`, `F2: command steering angle through the steering motor`, `F3: request braking through the brake actuator`. One actuator per function line; split any line that names two.
2. For every arrow that crosses the boundary, add one interface row: `id`, `direction` (in or out), `medium` (CAN bus id and bitrate, Ethernet, ROS 2 topic, GPIO, analog wire, 12 V rail), and the signal list. Add every entry of `known_interfaces`.
3. List operating modes. At minimum: `off`, `initializing`, `manual` (human drives, item outputs inactive), `automated`, `degraded`, `stopped`. Add any mode the description names.
4. For every mode, state which functions are active. A function active in `manual` mode that commands an actuator is an open question to raise now.

### Output
`functions`, `interfaces`, `operating_modes` lists.

### Quality Gate
- Every function names exactly one actuator or output.
- Every interface row has all five fields filled; none says "TBD" without a matching `open_questions` entry.
- The mode table has a row for each listed mode and a column for each function.

---

## Phase 3: Assumptions and Open Questions

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Write one assumption per external dependency, for example `A1: the base vehicle service brake remains fully functional and is never routed through the item`, `A2: testing happens on a closed course with an independent hardware emergency stop`. Give each an owner (a person or team role).
2. Write assumptions about the operating environment that later SOTIF work will test: speed range, surface, lighting, weather, presence of people. Use the user's own numbers; if a number is missing, add an open question instead of choosing one.
3. Record as open questions anything Phase 1 or 2 could not settle.
4. Assemble `item_definition` as JSON with the field names listed under Outputs.

### Output
`item_definition`.

### Quality Gate
- `item_definition` parses as JSON (`jq . item_definition.json` exits 0).
- Every assumption has an owner.
- Every numeric value in `assumptions` traces to `system_description` text or appears in `open_questions`.

---

## Worked Example

Illustrative only. Input: "Low-speed electric utility cart converted to drive-by-wire for closed-course research. A Linux computer sends speed and steering commands over CAN to a motor controller and a steering motor driver. The original hydraulic brake stays mechanical; an added linear actuator can press the pedal." `platform_class` = `closed-course-vehicle`.

- Phase 1: inside = Linux compute, CAN gateway board, steering motor driver, brake pedal actuator, firmware; outside = traction motor controller (closed firmware), hydraulic brake, operator, track surface. `standard_family` = ISO 26262 and ISO 21448 as method.
- Phase 2: `F1 command traction torque request on CAN 0x200`, `F2 command steering angle on CAN 0x210`, `F3 command brake actuator position`. Interface `IF3: out, CAN 500 kbit/s, 0x210 steering_angle_cmd, alive_counter, crc8`. Mode `manual`: F1 to F3 inactive.
- Phase 3: `A1: hydraulic brake pedal stays mechanically operable by the safety driver at all times (owner: test lead)`. Open question: `Q1: maximum test speed not stated`.

---

## Exit Criteria

DONE when `item_definition` is valid JSON with a boundary, at least one function per actuator, every crossing interface, a mode table, owned assumptions and an explicit open-question list.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Description names no actuator | **Stop**: ask the user what physical output the function controls; a HARA needs one. |
| Phase 1 | `platform_class` not in the list | **Return**: ask the user to pick one of the four values. |
| Phase 2 | One function line controls two actuators | **Adjust**: split it into two functions before continuing. |
| Phase 3 | User refuses to give speed or environment limits | **Adjust**: record them as open questions; do not invent values. |

**Do not:** copy a generic item definition from another project, merge functions to make the list shorter, or claim the item meets any standard.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
