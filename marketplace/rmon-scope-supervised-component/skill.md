# Scope the Supervised Component

**One-line description:** Produces the monitor scope for one autonomous or AI decision component: every command it emits, every input it consumes, every actuator those commands reach, and the hazard each command can cause, so later flows build checks for a closed and complete list.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `system_description` (string, required): Path to the architecture document, interface control document (ICD), or source tree of the system that contains the decision component.
- `hazard_list` (object[], required): Hazard log rows from the hazard analysis (for example an ISO 26262-3 HARA, an ISO 21448 SOTIF analysis, or an IEC 61508 hazard log): `hazard_id`, `description`, `severity` or equivalent rating.
- `stack` (string, required): Monitor implementation language, one of `python` or `cpp`. Later chain steps branch on it.
- `middleware` (string, optional): `ros2` when the component talks over ROS 2 topics, otherwise `none`. Default `none`.

---

## Outputs

- `monitor_scope` (object): `component` (name, process, host), `commands` (list: name, unit, message or topic or CAN ID, producer, consumer actuator, rate), `inputs` (list: name, unit, source sensor, transport), `actuators` (list), `hazard_map` (command to `hazard_id` list), `stack`, `middleware`, `unmapped_hazards`.

---

## Phase 1: Enumerate Commands and Inputs

### Entry Criteria
- `system_description` path exists and is readable.
- `stack` is `python` or `cpp`.

### Actions
1. Name exactly ONE supervised component (for example "trajectory planner" or "learned speed policy"). If the document describes several, stop and run this flow once per component.
2. List every output the component sends that can change physical state or another system's state: setpoints, trajectories, mode requests, enable flags. Find them from the ICD, or from code with a search such as `rg -n "publish\(|create_publisher|send\(|can_send|write\(" <src_dir>`.
3. For each command record: name, engineering unit, transport identifier (ROS 2 topic name, CAN arbitration ID, socket port, shared memory key), nominal rate in Hz as written in the ICD, and the actuator or downstream system that consumes it.
4. List every input the component reads (sensor topics, fused state, map data, operator inputs) with unit and transport.
5. If a command has no documented unit or rate, write `"unknown"` and add it to an open list. Do NOT guess units.

### Output
Draft command and input tables.

### Quality Gate
- Every command row has a transport identifier that appears verbatim in the ICD or in the source (`rg -n "<identifier>" <src_dir>` returns at least one line).
- No row has an empty unit field; unknowns are the literal string `unknown`.

---

## Phase 2: Map Commands to Hazards

### Entry Criteria
- Command table exists.

### Actions
1. For each `hazard_list` row, find which commands can cause or worsen it. A command contributes when a wrong value, a wrong time, a missing message, or a repeated stale message can lead to the hazard.
2. Record the mapping as `hazard_map[command] = [hazard_id, ...]`.
3. Put any hazard with no contributing command into `unmapped_hazards`. That is a scoping gap, not a pass: either a command is missing from Phase 1 or the hazard is outside this component.
4. Mark which actuators are braking or emergency stop paths. Write next to them: "outside the monitor's switching authority; never gated by software". The monitor may request braking but never delays or blocks it.

### Output
`hazard_map` and `unmapped_hazards`.

### Quality Gate
- Every `hazard_id` in `hazard_list` appears in `hazard_map` values or in `unmapped_hazards`.
- Every braking or emergency stop actuator carries the "never gated" note.

---

## Phase 3: Emit the Scope

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Assemble `monitor_scope` as JSON with the fields listed in Outputs, including `stack` and `middleware` copied from the inputs.
2. Validate it parses: `python -c "import json,sys; json.load(open('monitor_scope.json'))"`.
3. Do NOT start writing checks or thresholds here. Bounds come only from `rmon-envelope-from-requirements`.

### Output
`monitor_scope`.

### Quality Gate
- The JSON parse command exits 0.
- `commands` has at least one row and every row has a non-empty `hazard_map` entry or is listed with a reason why no hazard applies.

---

## Worked Example

Illustrative only. A learned speed policy on a ground robot publishes `/cmd_vel` (geometry_msgs/Twist, ICD rate 50 Hz) and reads `/odom` and `/scan`.

```
$ rg -n "create_publisher" src/policy_node/
src/policy_node/node.py:41:        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)
```
Phase 1 gives one command `/cmd_vel.linear.x` (m/s) and `/cmd_vel.angular.z` (rad/s), consumer: motor controller. Phase 2 maps `/cmd_vel.linear.x` to H-01 "collision with person" and H-03 "tip-over on slope". H-07 "battery thermal event" has no command and goes to `unmapped_hazards`. The motor controller's brake input is marked "never gated".

---

## Exit Criteria

DONE when `monitor_scope` lists every command, input and actuator of one component, every hazard is mapped or listed as unmapped, and braking paths are marked as never gated.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No ICD and no source access | **Stop**: the monitor cannot be scoped from guesses; request the interface document. |
| Phase 1 | More than one decision component described | **Adjust**: pick one; rerun the flow for each other component. |
| Phase 2 | Hazard list missing or empty | **Return**: to the hazard analysis owner; a monitor without hazards has no purpose to check. |
| Phase 3 | JSON does not parse | **Retry**: fix the reported line and rerun the parse command. |

**Do not:** invent units or rates, merge several components into one scope, or list braking as something the monitor may hold back.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
