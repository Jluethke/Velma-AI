# Score the Test Set Once with a Bootstrap Confidence Interval

**One-line description:** Scores the tuned model on the held-out test split exactly once, saves the predictions, and reports the primary metric with a bootstrap confidence interval from `scipy.stats.bootstrap`, resampling clusters for grouped data and blocks for time-ordered data.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuned_model` (object, required): From `mlp-optuna-search`.
- `split_manifest` (object, required): From `mlp-split-integrity-check`.
- `primary_metric` (object, required): From `mlp-frame-problem-metric`.
- `confidence_level` (number, required): For example 0.95 (the `scipy.stats.bootstrap` default); a user choice that later flows reuse.

---

## Outputs

- `test_predictions` (object): Path to `reports/test_predictions.parquet` with `row_id`, `y_true`, `y_score` (probabilities or predictions), the group or time column, and the md5 of the file.
- `metric_ci` (object): Point estimate, lower and upper bound, `confidence_level`, resampling unit (row, group, block), `n_resamples`, method, seed, and the number of resamples where the metric was undefined.

---

## Phase 1: Predict on Test Once

### Entry Criteria
- `tuned_model` is final. Any change after this step means the test score is no longer an unbiased estimate.
- `reports/test_predictions.parquet` does not already exist. If it does, a previous model was already scored; record that the test set has been used before.

### Actions
1. Load test rows via `split_manifest` and the model from `tuned_model`.
2. Predict: classifiers with probability metrics `y_score = model.predict_proba(X_test)[:, 1]` (binary) or the full matrix (multiclass); regressors `model.predict(X_test)`.
3. Save `row_id`, `y_true`, `y_score` and the grouping/time column to `reports/test_predictions.parquet` and record its md5.
4. Compute the point estimate with the same scorer function used in CV (`sklearn.metrics.average_precision_score`, `roc_auc_score`, `mean_absolute_error`, ...).
5. Log the point estimate to the tracker as `test_<metric>`.

### Output
Saved test predictions and point estimate.

### Quality Gate
- Row count in `test_predictions.parquet` equals the test count in `split_manifest`.
- `git log --oneline -- reports/test_predictions.parquet` (or the tracker) shows this is the first scoring of this model.

---

## Phase 2: Bootstrap the Interval

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Choose the resampling unit:

| Split strategy | Unit | How |
|---|---|---|
| `random` | Row | `scipy.stats.bootstrap((y_true, y_score), stat, paired=True, vectorized=False, n_resamples=9999, confidence_level=cl, method="BCa", random_state=rng)` (9999 and BCa are SciPy's defaults; check your SciPy version) |
| `group` | Group (cluster bootstrap) | Resample group IDs with replacement, concatenate their rows, compute the metric; repeat. Use percentile bounds. |
| `time` | Contiguous block | Moving-block bootstrap over time-sorted rows; block length is a user input (for example one seasonal period). Use percentile bounds. |

   Rows within a group or nearby in time are correlated; a row bootstrap then gives an interval that is too narrow.
2. `stat` for row bootstrap: `def stat(y, s): return average_precision_score(y, s)`. With `paired=True`, SciPy resamples the same indices for both arrays.
3. Undefined resamples: ROC AUC and average precision are undefined when a resample has one class (scikit-learn raises or warns). Count them; for the manual cluster and block bootstraps skip them and record the count. If the count is non-zero, report it beside the interval and add an open question: the interval is conditional on resamples that contain both classes, and the test set may be too small for this metric.
4. If BCa returns NaN bounds (it can with degenerate or highly discrete statistics), rerun with `method="percentile"` and record the switch.
5. Seed the bootstrap with `np.random.default_rng(seed)`.

### Output
Interval bounds.

### Quality Gate
- `low <= point <= high` holds (with BCa it usually does; if not, record it and report the percentile interval too).
- The resampling unit matches the split strategy per the table.

---

## Phase 3: Report

### Entry Criteria
- Bounds exist.

### Actions
1. Write `metric_ci` and log `test_<metric>_ci_low` and `test_<metric>_ci_high` to the tracker.
2. Report as: "average precision 0.362 (95% CI 0.341 to 0.384, cluster bootstrap over customers, 9999 resamples)". Always state the unit and resample count.
3. Do not retrain, re-tune, or change thresholds after reading this number. Any such change sends the project back to validation and makes the test set used.

### Output
`test_predictions`, `metric_ci`.

### Quality Gate
- The report sentence includes point, bounds, confidence level, unit and `n_resamples`.

---

## Worked Example

Illustrative only.

Input: grouped split by customer, 134,220 test rows from 31,004 customers, `confidence_level` = 0.95, metric average precision.

```
$ python src/test_ci.py
point AP: 0.3621
cluster bootstrap over customer_id, 9999 resamples, 0 undefined
95% percentile CI: [0.3408, 0.3839]
row bootstrap (for comparison only): [0.3502, 0.3744]   <- too narrow, rows are correlated
```

---

## Exit Criteria

DONE when the test set has been scored once, predictions are saved with a hash, and the metric is reported with an interval whose resampling unit matches the split.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Test predictions already exist from another model | **Adjust**: report that the test set is reused and how many times; do not delete the old file. |
| Phase 2 | `ValueError: Only one class present in y_true` | **Adjust**: count and skip that resample in the manual bootstrap; for `scipy.stats.bootstrap`, wrap `stat` to return `np.nan` and record the count. |
| Phase 2 | BCa bounds NaN | **Retry**: with `method="percentile"`. |
| Phase 3 | Someone wants to tune after seeing test | **Stop**: tuning returns to validation; a new test score must be labeled as reused. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
