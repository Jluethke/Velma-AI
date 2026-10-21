# PCB Placement Scoring

**One-line description:** Scores every placement candidate numerically from its board file (ratsnest length, switching hot-loop area, hotspot temperature rise, board area) and selects the best by the stated priority, recording the scores so the choice is measured.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `placement_candidates` (object[], required): From `pcb-placement-candidates`.
- `board_spec` (object, required): Power tree dissipation, ambient temperature, and selection priority (default: efficiency, then area, then cost).

---

## Outputs

- `placed_board` (string): Path to the selected candidate's board file.
- `placement_scorecard` (object[]): Every candidate's metric values, its rank, and the selected candidate's margin over the runner-up per metric.
- `layout_notes` (string[]): Placement decisions that matter for routing and bring-up: where each critical circuit sits, which strategy won, and why.

---

## Phase 1: Measure

### Entry Criteria
- At least 3 candidates present.

### Actions
1. For each candidate, load it with the `pcbnew` Python module and compute:
   - **Total ratsnest length:** sum over nets of the minimum spanning tree length between pads.
   - **Hot-loop area per switching regulator:** polygon area enclosed by input capacitor, switch node pins, and return path pads, in mm^2.
   - **Hotspot temperature rise estimate:** for each part dissipating above 0.1 W, rise = P x theta, using the datasheet theta-JA adjusted for the copper area available around it; record the inputs used.
   - **Board area:** bounding area of placed parts plus edge clearance, against the outline.
2. Record each value with its unit.

### Output
Raw metrics per candidate.

### Quality Gate
- Every candidate has all four metrics with units.
- Every temperature estimate cites the theta value and its source.

---

## Phase 2: Select

### Entry Criteria
- Metrics complete.

### Actions
1. Rank candidates per metric. Hot-loop area and temperature rise map to efficiency and reliability; ratsnest length maps to routability and loss; area maps to cost.
2. Select by the priority order. Break ties with the lower hot-loop area.
3. Record the selected candidate's margin over the runner-up on each metric in `placement_scorecard`. If the margin is zero on every metric, state that the strategies did not differ measurably.
4. Copy the selected board to `placed_board` and write `layout_notes`.

### Output
`placed_board`, `placement_scorecard`, `layout_notes`.

### Quality Gate
- Selection follows the stated priority and is reproducible from the scorecard.
- Margins over the runner-up are stated per metric.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Score placement candidates on ratsnest length, switching hot-loop area, hotspot , the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when one placement is selected by a recorded numeric comparison and its decisions are written for routing.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Theta-JA not in datasheet | **Adjust**: use the package's generic JEDEC value, mark it as an estimate. |
| Phase 1 | No switching regulators on the board | **Adjust**: omit hot-loop area, record why. |
| Phase 2 | All candidates tie | **Adjust**: select the smallest area and note the tie. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
