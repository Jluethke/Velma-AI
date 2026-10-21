# Error Analysis by Data Slice

**One-line description:** Computes the primary metric with confidence intervals for every value of user-named slice columns and for quantile bins of key numeric features using Fairlearn `MetricFrame`, flags slices whose interval lies entirely below the overall score, and pulls example errors from each flagged slice.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `test_predictions` (object, required): From `mlp-bootstrap-metric-ci`.
- `slice_columns` (string[], required): Columns to slice by (region, device, product line, data source, age band), chosen by the user.
- `primary_metric` (object, required): From `mlp-frame-problem-metric`.
- `min_slice_size` (integer, required): Smallest slice reported with its own metric, a user input. Smaller slices are merged into "other" and listed.

---

## Outputs

- `slice_report` (object): Path to `reports/slices.csv` and `reports/slices.md`, with per slice: size, positive rate, metric, interval, difference from overall, and a `flag` column; plus the list of slices below `min_slice_size` and example error row IDs per flagged slice.

---

## Phase 1: Build Slices

### Entry Criteria
- `test_predictions.parquet` exists and its md5 matches `test_predictions`.

### Actions
1. Join the slice columns onto the test predictions by `row_id` from the versioned data (not from a fresh query; the data must be the version in `data_version`).
2. For each categorical slice column, count rows per value; values below `min_slice_size` go to `"__other__"` and are listed by name.
3. For up to the numeric features the user names, bin into quantiles: `pl.col(x).qcut(q, allow_duplicates=True)` with q chosen by the user. Quantile bins keep sizes equal, so intervals are comparable.
4. Add intersections only when the user names them (for example `region x device`); intersections shrink fast and multiply comparisons.

### Output
Slice assignments per row.

### Quality Gate
- Every test row has a value for every slice column (null becomes its own `"__null__"` slice, not dropped).
- The `"__other__"` membership list is written.

---

## Phase 2: Metric per Slice

### Entry Criteria
- Slices built.

### Actions
1. Use Fairlearn: `from fairlearn.metrics import MetricFrame; mf = MetricFrame(metrics={"metric": metric_fn, "count": fairlearn.metrics.count}, y_true=y, y_pred=score, sensitive_features=df[slice_cols])`. `sensitive_features` takes any slicing column, not only protected attributes. `mf.by_group` gives the per-slice table; `mf.overall` the overall value; `mf.difference()` the largest gap. Fairlearn expects NumPy arrays or a DataFrame it supports; convert polars columns with `.to_numpy()`.
2. Interval per slice: bootstrap within the slice with the same unit as `mlp-bootstrap-metric-ci` (rows, groups, blocks), same `confidence_level`.
3. Undefined slice metrics (ROC AUC on a slice with one class) are reported as `undefined`, with the class counts. Do not drop the slice.
4. Flag rule:

| Slice interval vs overall point estimate | `flag` |
|---|---|
| Upper bound below overall (greater-is-better metric) | `worse` |
| Lower bound above overall | `better` |
| Contains overall | `none` |

5. Many slices means many comparisons; some `worse` flags will appear by chance. Report the number of slices tested beside the number flagged.

### Output
`reports/slices.csv`.

### Quality Gate
- `reports/slices.csv` has one row per slice with size, metric, low, high, flag.
- The sum of slice sizes per slice column equals the test row count.

---

## Phase 3: Read Errors in Flagged Slices

### Entry Criteria
- At least one slice is flagged `worse`, or the report states none were.

### Actions
1. For each `worse` slice, sample error rows with a seeded sampler: highest-confidence false positives and false negatives (sort by `y_score`).
2. For each sample row, write one line: which feature values stand out, and one of these cause codes:

| Code | Meaning |
|---|---|
| `label_noise` | Label looks wrong on reading the source record |
| `feature_missing` | Key feature is null or default for this slice |
| `distribution_shift` | Slice is rare in train (compare train size of the slice) |
| `true_hard` | Information needed is not in the features |

3. Compute the slice's share of train rows from `split_manifest`; a slice that is small in train and worse in test points to `distribution_shift`.
4. Write `reports/slices.md`: flagged slices, cause code counts, and recommended next actions (more data for the slice, a feature, a label fix). Do not change the model in this flow.

### Output
`slice_report`.

### Quality Gate
- Every `worse` slice has sampled rows with cause codes, or the report says no slice was flagged.
- `reports/slices.md` states the number of slices tested and flagged.

---

## Worked Example

Illustrative only.

Input: `slice_columns` = `["region", "device"]`, `min_slice_size` = user value 1000, AP overall 0.362 (95% CI 0.341 to 0.384).

```
slice            n      pos_rate  AP     low    high   flag
region=EU        41,220 0.048     0.381  0.352  0.410  none
region=LATAM      6,804 0.071     0.244  0.205  0.287  worse
device=ios       52,118 0.044     0.371  0.344  0.399  none
device=__null__   2,030 0.090     0.198  0.150  0.251  worse
slices tested: 11  flagged worse: 2
```
LATAM is 2.1% of train rows; sampled errors coded `distribution_shift` (9 of 12). Null-device rows: 10 of 12 coded `feature_missing` (device field not sent by the legacy checkout).

---

## Exit Criteria

DONE when every slice has a size, metric and interval, flagged slices have coded error samples, and the report states how many slices were tested.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Slice column absent from versioned data | **Return**: to the data owner; do not join from a live table of a different version. |
| Phase 2 | `ImportError: fairlearn` | **Adjust**: `pip install fairlearn`, or compute per-slice metrics with polars `group_by` and the same metric function. |
| Phase 2 | Every slice below `min_slice_size` | **Adjust**: report the overall metric only and ask the user for a smaller size or coarser slices. |
| Phase 3 | Fix suggested inside this flow | **Stop**: record it as a next action; model changes go back through validation. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
