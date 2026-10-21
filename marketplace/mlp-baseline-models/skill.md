# Fit and Score Baseline Models

**One-line description:** Fits a ladder of baselines (dummy, simple heuristic or naive forecast, linear model in a pipeline) with the exact split and metric of the project, so every later model is judged by how much it beats the simplest thing that works.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `split_manifest` (object, required): From `mlp-split-integrity-check`.
- `problem_frame` (object, required): From `mlp-frame-problem-metric`.
- `primary_metric` (object, required): From `mlp-frame-problem-metric`.
- `clean_feature_list` (string[], required): From `mlp-leakage-audit`.

---

## Outputs

- `baseline_models` (object[]): Path of each fitted baseline (`models/baseline_<name>.joblib`) and its class and parameters.
- `baseline_scores` (object[]): Per baseline: per-fold CV scores, mean, standard deviation, and validation score with the primary metric. Test is not touched.

---

## Phase 1: Pick the Baseline Ladder

### Entry Criteria
- `split_manifest` gate passed; `primary_metric.scoring` is known.

### Actions
1. Choose rungs from this table by `problem_frame.task_type`:

| Task | Rung 1 (no features) | Rung 2 (one rule) | Rung 3 (simple model) |
|---|---|---|---|
| `binary` / `multiclass` | `DummyClassifier(strategy="prior")` (gives calibrated constant probabilities; `"most_frequent"` gives constant labels) | The existing business rule if one exists, wrapped as a function | `make_pipeline(<preprocessing>, LogisticRegression(max_iter=<user value>))` |
| `regression` | `DummyRegressor(strategy="mean")`, or `"median"` when the metric is MAE | The existing rule if one exists | `make_pipeline(<preprocessing>, Ridge())` |
| `forecasting` | Naive: last observed value per series | Seasonal naive: value one season ago (season length from the user) | Linear model on lag features |

2. For ranking metrics (`roc_auc`, `average_precision`), the dummy scores 0.5 ROC AUC and the positive rate for average precision. Write those expected values down before running; a dummy that scores differently means the scorer or labels are wrong.
3. Do not add gradient boosting or neural networks here. Baselines must be quick and explainable.

### Output
Baseline ladder with expected dummy scores.

### Quality Gate
- At least rung 1 and rung 3 are listed; expected dummy score is written for ranking metrics.

---

## Phase 2: Fit and Score

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Load the train rows and folds from `split_manifest`. Build a `PredefinedSplit(test_fold=fold_array)` from the saved `fold` column, so CV uses exactly the saved folds. Do not create a new `KFold` here.
2. For grouped splits, the saved folds already respect groups; `PredefinedSplit` keeps that. For TIME splits, do NOT use `PredefinedSplit`: it trains on every other fold, including later ones. Build the forward-chaining list instead, `cv = [(np.where(fold < i)[0], np.where(fold == i)[0]) for i in range(1, k)]` (with the gap rows already excluded by the split), and pass that list as `cv=`. Write a helper `src/cv.py::project_cv(split_manifest)` that returns the right object for the strategy and use it in every later flow.
3. Score each rung: `cross_validate(est, X_train, y_train, cv=project_cv(split_manifest), scoring=primary_metric.scoring, return_train_score=True)`.
4. Fit each rung on all train rows and score on validation rows with the same scorer: `get_scorer(primary_metric.scoring)(est, X_val, y_val)`.
5. Save with `joblib.dump(est, "models/baseline_<name>.joblib")`.
6. Do NOT score on test. Test is scored once, in `mlp-bootstrap-metric-ci`.
7. Note the sign: scorers named `neg_*` return negative numbers; higher (closer to zero) is better.

### Output
`baseline_models`, `baseline_scores`.

### Quality Gate
- The dummy's validation score equals the expected value from Phase 1 for ranking metrics (up to the printed digits).
- Every baseline has 1 CV score per fold plus a validation score.
- `git grep -n "test" -- src/baselines.py` shows no use of test rows.

---

## Phase 3: Read the Ladder

### Entry Criteria
- Scores exist.

### Actions
1. Print a table: rung, CV mean, CV std, validation score, train score.
2. Apply:

| Observation | Meaning |
|---|---|
| Rung 3 does not beat rung 1 on CV mean by more than the CV std | Features carry little signal, or a bug; check label alignment before modeling further. |
| Train score far above CV score for rung 3 | Overfitting even in a linear model; check for ID-like features missed by the leakage audit. |
| Rung 3 beats rung 1 clearly | Proceed; later models must beat rung 3. |

3. Record the best baseline's validation score as the bar for `mlp-optuna-search`.

### Output
Interpreted `baseline_scores`.

### Quality Gate
- The table is printed and the matching row of the reading table is named.

---

## Worked Example

Illustrative only.

Input: binary refund task, positive rate 0.041, metric `average_precision`.

```
rung              cv_mean  cv_std  val     train
dummy_prior       0.0410   0.0006  0.0472  0.0410
rule_new_customer 0.0890   0.0041  0.0951  0.0893
logreg            0.2987   0.0102  0.3124  0.3051
```
Dummy AP equals the positive rate as expected. Logistic regression beats the dummy by far more than one std; bar for tuning = 0.3124 validation AP.

---

## Exit Criteria

DONE when each baseline is fitted on the saved folds, scored with the project metric on CV and validation, saved, and the bar for later models is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Dummy score differs from expectation | **Stop**: check label encoding (positive class is 1) and scorer name. |
| Phase 2 | `ConvergenceWarning` from `LogisticRegression` | **Adjust**: scale numeric features in the pipeline, or raise `max_iter` (user value); record the change. |
| Phase 2 | Scorer needs `predict_proba` and estimator lacks it | **Adjust**: use `DummyClassifier(strategy="prior")`, which has it. |
| Phase 3 | No rung beats the dummy | **Return**: to `mlp-leakage-audit` and `mlp-frame-problem-metric` to confirm labels and features. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
