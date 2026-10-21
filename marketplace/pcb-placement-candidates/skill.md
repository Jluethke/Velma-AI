# PCB Placement Candidates

**One-line description:** Scripts at least three distinct component placements for a set-up board, each obeying every hard placement rule and each following a different optimization strategy, so placement is chosen by measurement instead of habit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `setup_board` (string, required): Unplaced board file from `pcb-board-setup`.
- `board_spec` (object, required): Fixed connector positions, outline, power tree dissipation.
- `critical_circuits` (object[], required): Circuits whose placement rules are hard constraints.

---

## Outputs

- `placement_candidates` (object[]): Each candidate's board file path, its strategy name, the placement script that produced it, and a hard-rule compliance record.

---

## Phase 1: Encode the Hard Rules

### Entry Criteria
- `setup_board` exists with outline and rules.

### Actions
1. Write the hard rules as checks in a placement script in the user's project, using the `pcbnew` Python module:
   - connectors and mounting holes at their fixed `board_spec` coordinates;
   - input protection in current-flow order from the power connector: fuse, reverse protection, TVS, then regulators;
   - each bus transceiver within 10 mm of its connector, with its ESD protection between them;
   - each decoupling capacitor on the same side as its IC, within 2 mm of its pin;
   - each isolated domain entirely on its side of its keepout.
2. Make the script report pass or fail per rule for any board file.

### Output
Hard-rule checker.

### Quality Gate
- Every rule above is a check with a numeric threshold.

---

## Phase 2: Generate Candidates

### Entry Criteria
- Checker exists.

### Actions
1. Place the fixed items identically in every candidate.
2. Produce at least 3 candidates, each from a copy of `setup_board`, with distinct strategies:
   - **Switching-loop minimization:** each switching regulator's input capacitor, switch, and output capacitor placed to minimize the hot-loop area, power stages near the input.
   - **Signal-flow line:** parts ordered along the path of signal and power from input connector to output connector, minimizing crossings.
   - **Thermal spreading:** highest-dissipation parts (from the power tree) separated and placed near board edges or copper pour areas.
   - **Minimum area (optional fourth):** densest legal packing to test a smaller outline.
3. Within each strategy, place every remaining subcircuit grouped together.
4. Run the hard-rule checker on each candidate; fix any failing rule within that candidate's strategy, or discard the candidate.

### Output
`placement_candidates`.

### Quality Gate
- At least 3 candidates pass every hard rule.
- Each candidate's strategy is distinct and recorded with its script.
- No footprint overlaps another or the outline in any candidate.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Script at least three rule-compliant component placements, each under a distinct, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when at least three rule-compliant placements exist, each produced by a recorded script under a distinct strategy, ready for numeric scoring.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | A strategy cannot satisfy hard rules | **Adjust**: discard it and generate another strategy; never relax a hard rule. |
| Phase 2 | No candidate fits the outline | **Escalate**: report the area shortfall to propose a larger outline or more layers. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
