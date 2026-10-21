# Naming Shortlister

**One-line description:** Combines domain-availability signals with brand-conflict severity into a single ranked shortlist. Emits a top-3 recommendation with a buy-readiness score per candidate.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** No  --  single-party synthesis.

---

## Inputs

- `availability_grid` (array, required): Per-(candidate × TLD) availability rows from `domain-availability-checker`.
- `score_per_candidate` (array, required): Per-candidate best-TLD score from `domain-availability-checker`.
- `conflict_report` (array, required): Per-candidate brand-conflict severity from `brand-conflict-search`.
- `weighting_config` (object, optional): Weights used to combine signals. Default:
  ```
  {
    "availability_weight": 0.6,
    "conflict_weight":      0.4,
    "prefer_dot_com_bonus": 1.0,
    "length_penalty_per_char_over_10": 0.05
  }
  ```

## Outputs

- `ranked_shortlist` (array): All candidates ranked by composite score, with per-candidate rationale and best-TLD recommendation.
- `recommendation_top3` (array of 3): The three candidates with the highest composite score and a registration action plan.
- `buy_readiness_score` (number): Overall confidence 0–100 that at least one top-3 candidate is immediately registrable.

### Composite score formula

```
availability_normalized = score_per_candidate / 3        # 0..1
conflict_normalized     = {none: 1.0, low: 0.7, medium: 0.3, high: 0.0}[conflict_severity]

composite_base = availability_weight * availability_normalized
               + conflict_weight     * conflict_normalized

composite = composite_base
          + prefer_dot_com_bonus * (1 if ".com" is score-3 else 0)
          - length_penalty_per_char_over_10 * max(0, len(name) - 10)
```

Higher composite = better. Bound to [0, 2] for display.

---

## Execution Phases

### Phase 0: Input Fit-Check
### Entry Criteria
All three input feeds present.
### Actions
Verify every candidate appears in both `score_per_candidate` AND `conflict_report`; warn on mismatches.
### Output
Reconciled candidate set.
### Quality Gate
No orphan candidates (appearing in one feed but not the other) survive.

### Phase 1: Composite Scoring
### Entry Criteria
Reconciled set ready.
### Actions
Apply the composite formula per candidate using `weighting_config`.
### Output
Per-candidate composite scores.
### Quality Gate
Every candidate has a numeric composite in [0, 2].

### Phase 2: Rank + Top-3 Selection
### Entry Criteria
Composite scores computed.
### Actions
1. Rank candidates by composite descending. 2. Resolve ties by preferring .com-available, then shorter length. 3. Extract top 3. 4. For each top-3, draft a registration action plan: which registrar, estimated cost, alternate TLDs to also claim for brand defense.
### Output
`recommendation_top3` with action plans.
### Quality Gate
Top 3 are each .com-available OR explicitly documented as ".com blocked  --  alternate TLD rationale: ...".

### Phase 3: Overall Buy-Readiness
### Entry Criteria
Top 3 selected.
### Actions
Compute `buy_readiness_score` = 100 × (avg composite of top 3) / 2. Emit full `ranked_shortlist` with rationale per row.
### Output
Final outputs.
### Quality Gate
Buy-readiness ≥ 60 for the chain to be considered "actionable"; below 60 → recommendation is to loop back to `naming-candidate-generator` with expanded root set.

---

## Reference Runner

`F:/The Wayfinder Trust/IP/projects/MarketingOutreach/Naming/naming_flow.py`  --  `write_shortlist` function (partial; conflict-weighting layer is new in this flow and lives only in the skill.md spec until the Python runner is extended).

---

## Worked Example

Illustrative only.

Given typical inputs for Combines domain-availability signals with brand-conflict severity into a single , the pipeline produces structured outputs through each phase, with quality gates verified at every stage.


---

## Exit Criteria

DONE when all phase quality gates pass and all outputs are populated.


---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Any | Missing required input | **Stop**: report which input is missing and what it should contain. |
| Any | Upstream phase output incomplete | **Return**: re-run the upstream phase with the gap identified. |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
