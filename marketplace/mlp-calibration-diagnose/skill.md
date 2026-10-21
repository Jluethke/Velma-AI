# Diagnose Probability Calibration

**One-line description:** Measures whether predicted probabilities match observed frequencies using out-of-fold validation predictions, with a reliability diagram from `sklearn.calibration.calibration_curve`, Brier score, log loss and a binned expected calibration error, and decides by rule whether calibration is needed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuned_model` (object, required): From `mlp-optuna-search`.
- `split_manifest` (object, required): From `mlp-split-integrity-check`.
- `problem_frame` (object, required): From `mlp-frame-problem-metric`; `uses_probabilities` decides whether this matters.

---

## Outputs

- `calibration_report` (object): Out-of-fold Brier score and log loss, binned ECE with the binning stated, the reliability table (bin mean predicted, observed frequency, count), the plot path, the number of calibration rows available, and the decision `calibrate` or `skip` with the rule that produced it.

---

## Phase 1: Collect Out-of-Fold Probabilities

### Entry Criteria
- The task is `binary` or `multiclass` and the model has `predict_proba` (or logits for PyTorch).

### Actions
1. If `problem_frame.uses_probabilities` is "no", record `decision = skip` with reason "only ranking or labels are consumed" and finish. Calibration does not change ranking metrics for monotonic methods.
2. Get honest probabilities without touching test:
   - scikit-learn: `oof = cross_val_predict(pipe_with_best_params, X_trainval, y_trainval, cv=project_cv(split_manifest), method="predict_proba")`. For time splits, `cross_val_predict` requires a partition; use a manual loop over the forward-chaining folds and keep only predicted rows.
   - PyTorch: run the tuned model on validation rows and apply `softmax` (or `sigmoid` for one logit) to logits.
3. Save `reports/oof_probs.parquet` with `row_id`, `y_true`, probabilities.

### Output
Out-of-fold probabilities.

### Quality Gate
- Every probability row sums to 1 within float rounding (multiclass) or lies in [0, 1] (binary).

---

## Phase 2: Measure

### Entry Criteria
- `oof_probs.parquet` exists.

### Actions
1. Reliability table: `prob_true, prob_pred = calibration_curve(y, p, n_bins=n_bins, strategy="quantile")`. The scikit-learn default is `n_bins=5, strategy="uniform"`; quantile bins keep counts equal when probabilities cluster near 0. Record which you used.
2. Plot: `CalibrationDisplay.from_predictions(y, p, n_bins=n_bins, strategy="quantile")` and save to `reports/reliability.png`.
3. Scores: `brier_score_loss(y, p)`, `log_loss(y, P)`. Compare with the same scores for the prior-only `DummyClassifier(strategy="prior")` probabilities on the same rows; a model that does not beat the prior on Brier score is not useful as a probability source.
4. ECE (not in scikit-learn): `ece = sum(count_b / N * abs(prob_true_b - prob_pred_b))` over the bins from step 1. ECE depends on the binning; always report it with `n_bins` and strategy.
5. Multiclass: compute steps 1 to 4 per class one-vs-rest and also the top-label version (confidence of the predicted class vs whether it was correct).

### Output
Calibration measurements.

### Quality Gate
- Reliability table with per-bin counts, Brier, log loss, ECE (with binning) and the prior baseline Brier are recorded.

---

## Phase 3: Decide

### Entry Criteria
- Measurements exist.

### Actions
1. Apply in order; the first matching row wins:

| Condition | Decision |
|---|---|
| `uses_probabilities` = no | `skip` |
| Reliability bins sit on the diagonal: every bin's observed frequency lies inside that bin's binomial confidence interval (Wilson interval at the project confidence level used in `mlp-bootstrap-metric-ci`, from `statsmodels.stats.proportion.proportion_confint(count_pos, count, method="wilson")`) | `skip` |
| Otherwise | `calibrate` |

2. Record the shape: predictions too extreme (curve flatter than diagonal, typical of boosted trees and deep networks) or too timid (curve steeper, typical of random forests and naive Bayes). This informs the method choice downstream.
3. Record the number of rows available for fitting a calibrator (validation rows, or out-of-fold rows); the calibration flows choose the method from it.
4. Look at the test set only for the final report line, after the decision: compute test Brier from `test_predictions` if it exists and note it. Never decide based on test.

### Output
`calibration_report`.

### Quality Gate
- `decision` is `calibrate` or `skip` and names the table row.
- The per-bin Wilson interval check is printed for every bin.

---

## Worked Example

Illustrative only.

Input: `HistGradientBoostingClassifier`, binary, `uses_probabilities` = yes, 150,000 out-of-fold rows, 10 quantile bins.

```
bin  mean_pred  obs_freq  count   wilson_95
0    0.004      0.006     15000   [0.0049, 0.0073]   outside
...
9    0.412      0.331     15000   [0.3235, 0.3385]   outside
brier 0.0352   prior brier 0.0393   log_loss 0.1291   ECE(10, quantile) 0.0118
shape: too extreme
decision: calibrate (row 3)
```

---

## Exit Criteria

DONE when out-of-fold calibration is measured with stated binning, compared with the prior baseline, and a `calibrate` or `skip` decision is made by the table without using test data.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Model lacks `predict_proba` (for example `LinearSVC`) | **Adjust**: record `calibrate` as required; scores are not probabilities. |
| Phase 1 | `cross_val_predict` error about partitions on time folds | **Adjust**: manual loop over the forward-chaining folds. |
| Phase 2 | Empty bins with `strategy="uniform"` | **Adjust**: switch to `"quantile"` and record it. |
| Phase 3 | Pressure to calibrate on test | **Stop**: calibrators are fit on validation or out-of-fold rows only. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
