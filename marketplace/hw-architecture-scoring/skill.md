# Hardware Architecture Scoring

**One-line description:** Computes the baseline's metrics for every candidate architecture from datasheets, marks the Pareto front, rejects any candidate that weakens a critical circuit, and selects the best by the user's priority with every delta against baseline recorded.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `architecture_candidates` (object[], required): From `hw-architecture-candidates`.
- `baseline_architecture` (object, required): From `hw-baseline-architecture`.
- `baseline_metrics` (object, required): From `hw-baseline-architecture`.
- `critical_circuits` (object[], required): From `hw-critical-circuit-flagging`.

---

## Outputs

- `selected_architecture` (object): The chosen candidate, its blocks and parts, and the reason it was selected.
- `architecture_scorecard` (object[]): Every candidate and the baseline, each with efficiency (typical and worst), dissipation, part count, cost at 10 and 1000, area, layer count, Pareto status, and reject reason if any.
- `design_deltas` (object): For the selected architecture, the predicted delta on each objective against baseline, absolute and percent, plus the lever credited for each.

---

## Phase 1: Score Every Candidate

### Entry Criteria
- All inputs present.

### Actions
1. Apply the exact method `hw-baseline-architecture` used (same operating points, same price sources and quantities, same area multipliers) to each candidate, so differences come from design, not method.
2. Cite every datasheet curve and price used.

### Output
Draft `architecture_scorecard`.

### Quality Gate
- Every candidate has all six metrics computed by the baseline's method with citations.

---

## Phase 2: Safety Screen and Pareto Front

### Entry Criteria
- Draft scorecard complete.

### Actions
1. For each candidate, compare every touched critical circuit with its requirement in `critical_circuits`. Reject any candidate whose change removes protection or worsens a survival margin (lower TVS clamp margin, lower isolation rating, an interlock path through software).
2. Mark a candidate Pareto-optimal when no other surviving candidate is at least as good on every objective and better on one.

### Output
Scorecard with reject reasons and Pareto status.

### Quality Gate
- Every rejection names the critical circuit and the margin lost.
- Pareto status is computed over survivors only.

---

## Phase 3: Select and Record Deltas

### Entry Criteria
- Pareto front marked.

### Actions
1. Select from the Pareto front by priority: the user's stated priority, otherwise efficiency first, then area, then cost.
2. Compute each objective's delta against `baseline_metrics`, absolute and percent.
3. Credit each improvement to the lever that produced it, using single-lever candidates as evidence where available.
4. Call the selected design novel only when it shows a measured gain on at least one objective over baseline with no critical circuit weakened. If no candidate beats baseline, select the baseline and say so.

### Output
`selected_architecture`, `design_deltas`.

### Quality Gate
- Every delta is computed against `baseline_metrics`.
- The word novel appears only with a measured gain attached.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Score candidate architectures by the baseline's method, reject any that weaken a, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when every candidate is scored by one method, unsafe candidates are rejected with reasons, and the selection carries numeric deltas against baseline.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Metric uncomputable for a candidate | **Adjust**: mark the cell unknown; exclude the candidate from Pareto comparison on that objective. |
| Phase 2 | All candidates rejected | **Adjust**: select the baseline and return lever ideas to `hw-architecture-candidates`. |
| Phase 3 | Tie on priority objective | **Adjust**: break by the next objective in priority order. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
