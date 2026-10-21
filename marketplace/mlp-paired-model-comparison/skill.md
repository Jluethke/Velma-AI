# Paired Comparison of Two Models on the Same Test Rows

**One-line description:** Decides whether the tuned model beats the best baseline using paired tests on identical test rows: a paired bootstrap of the metric difference for any metric, and McNemar's exact test from statsmodels for accuracy-type outcomes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `test_predictions` (object, required): From `mlp-bootstrap-metric-ci`; the tuned model's saved test predictions.
- `baseline_models` (object[], required): From `mlp-baseline-models`; the best baseline is scored on the same rows.
- `split_manifest` (object, required): From `mlp-split-integrity-check`.
- `primary_metric` (object, required): From `mlp-frame-problem-metric`.
- `confidence_level` (number, required): Same value used in `mlp-bootstrap-metric-ci`.

---

## Outputs

- `comparison_result` (object): Metric for each model, the difference (tuned minus baseline), its paired bootstrap interval, the McNemar statistic and p-value when applicable, the resampling unit, and a verdict from the decision table.

---

## Phase 1: Align Predictions

### Entry Criteria
- Both models are final.

### Actions
1. Pick the best baseline by validation score from `baseline_scores` (recorded in `baseline_models`). Load it and predict on the same test rows; save to `reports/test_predictions_baseline.parquet`.
2. Join both prediction files on `row_id`. Assert the joined row count equals each file's row count and `y_true` is identical in both.
3. Do not compare a model scored on one test set with a model scored on another; the difference would mix data and model effects.

### Output
One aligned table: `row_id`, `y_true`, `score_tuned`, `score_base`, group/time column.

### Quality Gate
- Joined row count equals the test count; `(y_true_a == y_true_b).all()` prints `True`.

---

## Phase 2: Paired Bootstrap of the Difference

### Entry Criteria
- Aligned table exists.

### Actions
1. Define `diff(idx) = metric(y[idx], tuned[idx]) - metric(y[idx], base[idx])`. Both metrics use the SAME resampled indices; that is what makes it paired and why it is tighter than comparing two separate intervals.
2. Resample with the same unit as `mlp-bootstrap-metric-ci` (rows, groups, or time blocks) and the same `n_resamples`, seeded.
3. For row resampling, `scipy.stats.bootstrap((y, tuned, base), lambda y, a, b: metric(y, a) - metric(y, b), paired=True, vectorized=False, confidence_level=cl, random_state=rng)` works directly.
4. Record the point difference and interval.

### Output
Difference interval.

### Quality Gate
- The point difference equals metric(tuned) minus metric(base) computed directly on the full test set.

---

## Phase 3: McNemar Test and Verdict

### Entry Criteria
- Difference interval exists.

### Actions
1. Apply McNemar only when the metric is accuracy-type (per-row correct or incorrect at a fixed decision rule). For ranking metrics (ROC AUC, average precision), skip it; the paired bootstrap is the test.
2. Build the 2x2 table of per-row correctness: `[[both_right, tuned_right_base_wrong], [tuned_wrong_base_right, both_wrong]]`.
3. Run `from statsmodels.stats.contingency_tables import mcnemar; r = mcnemar(table, exact=True)`; read `r.statistic` and `r.pvalue`. Use `exact=True` (binomial) when the off-diagonal counts are small; `exact=False, correction=True` gives the chi-square version for large counts. McNemar assumes independent rows; for grouped or time data rely on the cluster or block bootstrap instead.
4. Verdict table (alpha = 1 minus `confidence_level`):

| Paired interval of (tuned minus base) | Verdict |
|---|---|
| Entirely above 0 (for a greater-is-better metric) | `tuned_better` |
| Entirely below 0 | `baseline_better`: ship the baseline or return to modeling |
| Contains 0 | `no_detected_difference`: prefer the simpler model per `mlp-optuna-search` Phase 3 |

5. Write `comparison_result` and log `test_diff_<metric>` with bounds to the tracker.

### Output
`comparison_result`.

### Quality Gate
- The verdict string is one of the three table values and matches the interval.

---

## Worked Example

Illustrative only.

Input: tuned `HistGradientBoostingClassifier` vs logistic baseline, AP, cluster bootstrap over customers, 0.95.

```
AP tuned 0.3621   AP base 0.3189   diff 0.0432
paired cluster bootstrap 95% CI for diff: [0.0301, 0.0566]
McNemar: skipped (ranking metric)
verdict: tuned_better
```

---

## Exit Criteria

DONE when both models are compared on identical rows with a paired interval (and McNemar where it applies) and a verdict from the table is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Row counts differ after the join | **Stop**: one model scored a different test set; rescore both on `split_manifest` test rows. |
| Phase 2 | Many undefined resamples | **Adjust**: record the count; the test set is small for this metric. |
| Phase 3 | Off-diagonal counts both zero | **Return**: models agree on every row; verdict `no_detected_difference`. |
| Phase 3 | Verdict `baseline_better` | **Return**: to `mlp-optuna-search` Phase 3 refit rule; do not re-tune on test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
