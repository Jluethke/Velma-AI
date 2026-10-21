# Hardware Design Delta Report

**One-line description:** Puts predicted and measured values side by side for every design objective against the conventional baseline, credits only the design levers that produced a measured gain, and names what the next revision should try.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `design_deltas` (object[], required): Predicted per-objective deltas of the selected architecture versus baseline, from `hw-architecture-scoring`.
- `architecture_scorecard` (object, required): Every candidate's predicted metrics and the lever each used.
- `layout_scorecard` (object, required): Measured board metrics from the finished layout file.
- `bringup_log` (object[], required): Bench measurements, including efficiency at light, typical, and full load and full-load dissipation.
- `baseline_metrics` (object, required): The conventional reference design's metrics.

---

## Outputs

- `delta_report` (object): A table per objective (conversion efficiency at each load, dissipation, board area, layer count, part count, BOM cost, via count, trace length) with baseline, predicted, and measured values and the measured delta; a list of levers with measured gains, levers without, and recommendations for the next revision.

---

## Phase 1: Assemble the Table

### Entry Criteria
- All inputs present; `bringup_log` contains the efficiency steps.

### Actions
1. For each objective, take the baseline value from `baseline_metrics` and the predicted value from `design_deltas`.
2. Take the measured value: efficiency and dissipation from `bringup_log`; area, layers, via count, trace length, and power path loss from `layout_scorecard`; part count and cost from the final BOM totals in `layout_scorecard` or `architecture_scorecard`.
3. Compute measured delta = measured minus baseline, and prediction error = measured minus predicted.

### Output
Objective table.

### Quality Gate
- Every objective has baseline, predicted, and measured values, or a stated reason a value is missing.
- Every measured value traces to a log entry or the board file.

---

## Phase 2: Credit the Levers

### Entry Criteria
- Table complete.

### Actions
1. For each lever named in `architecture_scorecard` for the selected design, list the objectives it was meant to move.
2. Credit the lever only when the measured delta on those objectives is better than baseline by more than measurement uncertainty (state the instrument accuracy used).
3. List levers with no measured gain, or whose gain came in under prediction by more than half, with the likely cause.
4. Write next-revision recommendations: keep credited levers, drop or rework failed ones, and try the next-ranked candidate lever from the scorecard.

### Output
`delta_report`.

### Quality Gate
- No lever is credited without a measured gain beyond uncertainty.
- Each recommendation ties to a row in the table.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Compare predicted and measured values for every objective against the convention, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when every objective shows baseline, predicted, and measured values, and every claim that the design beats the conventional baseline rests on a measured delta.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Efficiency steps missing from the log | **Stop**: return to `hw-bench-bringup-log` to take them. |
| Phase 1 | Baseline metric missing | **Adjust**: mark the objective unscored; make no claim on it. |
| Phase 2 | Gain within measurement uncertainty | **Adjust**: report as not demonstrated. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
