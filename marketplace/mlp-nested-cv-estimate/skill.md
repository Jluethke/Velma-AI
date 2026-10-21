# Nested Cross-Validation Estimate of a Tuned Model

**One-line description:** Measures how much hyperparameter selection inflates the CV score by running the whole tuning procedure inside each outer fold with scikit-learn (`GridSearchCV`, `RandomizedSearchCV` or Optuna's `OptunaSearchCV`) and reporting the outer-fold scores next to the inner best score.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `feature_pipeline` (object, required): From `mlp-sklearn-feature-pipeline`.
- `split_manifest` (object, required): From `mlp-split-integrity-check`.
- `primary_metric` (object, required): From `mlp-frame-problem-metric`.
- `search_space` (object, required): The same space used in `mlp-optuna-search`.
- `run_nested_cv` (boolean, required): Run this flow only when true (it multiplies compute by the number of outer folds).

---

## Outputs

- `nested_cv_scores` (object): Outer-fold scores, their mean and std, the inner best score per outer fold, the gap (inner best minus outer score) per fold, and the best parameters chosen in each outer fold.

---

## Phase 1: Build Inner and Outer Splitters

### Entry Criteria
- `run_nested_cv` is true.
- `stack` is scikit-learn (this flow wraps a scikit-learn search object).

### Actions
1. Outer splitter = the project's saved folds via `project_cv(split_manifest)` from `src/cv.py`.
2. Inner splitter by split strategy:

| Strategy | Inner splitter |
|---|---|
| `random` | `StratifiedKFold(n_splits=k_inner, shuffle=True, random_state=seed)` (or `KFold` for regression) |
| `group` | `StratifiedGroupKFold(n_splits=k_inner, shuffle=True, random_state=seed)` or `GroupKFold(n_splits=k_inner)`; pass `groups` through, see step 3 |
| `time` | `TimeSeriesSplit(n_splits=k_inner, gap=<gap in rows>)` on time-sorted rows |

   `k_inner` is a user input; scikit-learn's default `n_splits` is 5.
3. Groups inside nested CV: `cross_validate(search, X, y, groups=g, cv=outer)` passes `groups` to the outer split only. To pass them to the inner search, enable metadata routing (`sklearn.set_config(enable_metadata_routing=True)`, scikit-learn 1.4 or later) and call `params={"groups": g}` per the scikit-learn metadata routing guide. Without routing, the inner search ignores groups and leaks entities. Check your version's docs before writing this code.

### Output
Inner and outer splitter definitions.

### Quality Gate
- A dry loop over outer folds prints, for each, the inner fold count and (grouped) zero group overlap between inner train and inner eval.

---

## Phase 2: Run Nested CV

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Wrap the search:
   - grid: `search = GridSearchCV(pipe, param_grid, cv=inner, scoring=primary_metric.scoring, refit=True)`
   - random: `RandomizedSearchCV(pipe, param_distributions, n_iter=<user value>, cv=inner, scoring=..., random_state=seed)`
   - Optuna: `optuna_integration.OptunaSearchCV(pipe, param_distributions={name: optuna.distributions.FloatDistribution(low, high, log=True), ...}, cv=inner, scoring=..., n_trials=<user value>, random_state=seed)` (check the `optuna-integration` docs for the current import path)
   Parameter names inside a pipeline use the step prefix: `model__C`, not `C`.
2. Run: `res = cross_validate(search, X_trainval, y_trainval, cv=outer, scoring=primary_metric.scoring, return_estimator=True)`.
3. For each outer fold, read `res["estimator"][i].best_score_` (inner best) and `res["estimator"][i].best_params_`.
4. Do not include test rows. Nested CV estimates the tuning procedure's generalization from train and validation only.

### Output
Raw nested results.

### Quality Gate
- `len(res["test_score"])` equals the number of outer folds and none is NaN.

---

## Phase 3: Report the Selection Gap

### Entry Criteria
- Raw results exist.

### Actions
1. Compute per fold `gap_i = best_score_i - test_score_i`. Report mean outer score, std, and mean gap.
2. Read:

| Observation | Meaning |
|---|---|
| Mean gap clearly above zero (larger than the outer std) | The non-nested CV score from `mlp-optuna-search` overstates performance; report the nested outer mean as the CV estimate. |
| Best params differ widely across outer folds | The objective surface is flat or noisy; prefer the simpler setting. |
| Mean gap near zero | Selection bias is small for this space and data size. |

3. Record all numbers in `nested_cv_scores` and log them to the tracker as `nested_outer_mean`, `nested_outer_std`, `nested_gap_mean`.

### Output
`nested_cv_scores`.

### Quality Gate
- The per-fold table (outer score, inner best, gap, best params) is printed and recorded.

---

## Worked Example

Illustrative only.

Input: 5 outer folds, 3 inner folds, `RandomizedSearchCV` with 40 iterations over `model__C` and `model__l1_ratio`.

```
fold  inner_best  outer   gap     best_params
0     0.3121      0.2988  0.0133  C=0.21 l1=0.4
1     0.3149      0.2950  0.0199  C=0.18 l1=0.5
2     0.3098      0.3012  0.0086  C=0.25 l1=0.4
3     0.3170      0.2931  0.0239  C=0.11 l1=0.6
4     0.3135      0.2996  0.0139  C=0.20 l1=0.4
outer mean 0.2975 std 0.0031   gap mean 0.0159
```
Gap mean exceeds outer std: report 0.2975 as the CV estimate, not the inner 0.31.

---

## Exit Criteria

DONE when nested outer scores, inner best scores and the gap are recorded and logged, with groups routed to the inner splitter when the split is grouped.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `run_nested_cv` is false | **Return**: emit empty `nested_cv_scores` with reason "not requested". |
| Phase 1 | Metadata routing unavailable (old scikit-learn) | **Adjust**: write an explicit outer loop that calls `search.fit(X_tr, y_tr, groups=g_tr)` per fold. |
| Phase 2 | `ValueError: Invalid parameter 'C'` | **Adjust**: prefix with the pipeline step name, `model__C`. |
| Phase 2 | Runtime too long | **Adjust**: reduce `n_iter` or inner folds (user decision) and record the change. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
