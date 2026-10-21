# Design FMEA Worksheet (AIAG and VDA Seven-Step Method)

**One-line description:** Builds a design FMEA worksheet for the item's hardware and system elements using the seven steps of the AIAG and VDA FMEA Handbook (2019): structure tree, function net, failure chain (effect, mode, cause), severity, occurrence, detection, action priority from the handbook tables, and optimization actions with owners.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `item_definition` (object, required): Output of `fusa-item-definition`.
- `architecture_description` (string, required): Block diagram or element list (boards, MCUs, relays, sensors, actuators, harnesses, connectors).
- `fmea_rating_tables` (string, optional): Path to the organization's S, O and D rating tables and action priority table. When absent, the team must use the tables printed in the AIAG and VDA FMEA Handbook.

---

## Outputs

- `dfmea_worksheet` (object[]): One row per failure chain: `row_id`, `structure_element`, `function`, `failure_effect`, `failure_mode`, `failure_cause`, `S`, `prevention_controls`, `O`, `detection_controls`, `D`, `action_priority` (H, M, L), `actions`, `owner`, `linked_safety_goal`.

---

## Phase 1: Structure and Function Analysis (Steps 1 to 3)

### Entry Criteria
- `architecture_description` names hardware elements.
- The team has the handbook or `fmea_rating_tables`.

### Actions
1. Step 1 planning: write the scope in one line (which item, which revision) and the team roles.
2. Step 2 structure: build a three-level tree: item (focus level up), element (focus), component (focus level down). Example: `drive-by-wire item > steering actuator assembly > motor driver IC, current sense resistor, connector J4`.
3. Step 3 function: for each element write its function with a measurable output, for example "motor driver delivers phase current proportional to PWM duty". Link each element function to the higher-level item function from `item_definition.functions`.
4. Save the tree as a CSV with columns `level,parent,element,function` so the next phases can sort it.

### Output
`structure_function.csv`.

### Quality Gate
- Every element in `architecture_description` appears in the CSV.
- Every element function links to an item function id (`F1`, `F2`...).

---

## Phase 2: Failure Analysis and Rating (Steps 4 and 5)

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Step 4: for each element function, write the failure mode (loss, partial, intermittent, unintended, degraded), then the effect one level up and the cause one level down. One row per mode and cause pair.
2. Severity: rate 1 to 10 from the handbook DFMEA severity table. Any effect that matches a safety goal in the HARA must get the handbook's highest band (9 or 10, safety or regulatory); record the goal id in `linked_safety_goal`.
3. Occurrence: rate 1 to 10 from the handbook occurrence table using prevention controls (design rules, derating, proven parts). Write which prevention control justifies the number.
4. Detection: rate 1 to 10 from the handbook detection table, based on the test or analysis that would find the cause before release (bench test, HIL fault injection, FTA). A control that does not exist yet rates as no detection.
5. Look up `action_priority` in the handbook AP table for the S, O, D triple. Do not compute an RPN as the decision; the 2019 handbook replaced RPN-ranking with AP.

### Output
Rated failure chains.

### Quality Gate
- Every row has S, O and D integers from 1 to 10 and an AP of H, M or L.
- Every row with `linked_safety_goal` non-empty has S of 9 or 10.
- Every O and D value names the control that justifies it.

---

## Phase 3: Optimization and Documentation (Steps 6 and 7)

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. For every AP = H row, write an action that reduces occurrence (design change) or improves detection (new test), with an owner and a target date from the user.
2. For AP = M rows, write an action or a written rationale for no action.
3. Export the worksheet as JSON `dfmea_worksheet.json` and as CSV for spreadsheet review. Recommended tool for review is any spreadsheet program; keep the JSON as the source of truth.
4. Hand rows with `linked_safety_goal` to `fusa-fta-scram-cut-sets` as basic event candidates.

### Output
`dfmea_worksheet`.

### Quality Gate
- `jq '[.[]|select(.action_priority=="H" and (.actions|length)==0)]|length' dfmea_worksheet.json` prints 0.
- Every action has an owner.

---

## Worked Example

Illustrative only. Element "brake pedal linear actuator".

| Function | Mode | Effect | Cause | S | O | D |
|---|---|---|---|---|---|---|
| extends to commanded position | stuck extended | brake drag, vehicle cannot pull away | lead screw binding | 5 | 4 | 6 |
| extends on brake request | no extension | loss of automated deceleration (SG-03) | connector J7 open circuit | 10 | 3 | 5 |

The team reads the AP column for each triple from the handbook table and writes it into `action_priority`. The second row links to `SG-03`; whatever its AP, Phase 3 adds an action: "add connector continuity check at startup self-test", owner "firmware lead", because a safety-goal row is never left without a detection control.

---

## Exit Criteria

DONE when every element function has failure chains with S, O, D and AP from the handbook tables, every H row has an owned action, and safety-goal-linked rows are marked for the fault tree.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No rating tables available | **Stop**: obtain the handbook or the organization's tables; do not invent scales. |
| Phase 2 | Team wants to rank by RPN | **Adjust**: use the AP table; RPN may be shown but not used for the decision. |
| Phase 2 | Detection rated low for a test that does not exist | **Adjust**: rate as no detection until the test exists. |
| Phase 3 | H row with no feasible action | **Return**: escalate the design decision to the item owner with the row id. |

**Do not:** lower severity because occurrence is low, rate the same cause twice to inflate coverage, or close an action without the test result that proves it.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
