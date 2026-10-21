# Calibrate scikit-learn Probabilities with CalibratedClassifierCV

**One-line description:** Fits a sigmoid (Platt) or isotonic calibrator around the tuned scikit-learn pipeline with `CalibratedClassifierCV`, choosing the method and the fitting mode (cross-fitted or prefit with `FrozenEstimator`) by rule, and proves calibration improved on out-of-sample data without changing the ranking.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `tuned_model` (object, required): From `mlp-optuna-search`; a fitted scikit-learn `Pipeline`.
- `split_manifest` (object, required): From `mlp-split-integrity-check`.
- `calibration_report` (object, required): From `mlp-calibration-diagnose`; must say `calibrate`, and gives the shape and the calibration row count.

---

## Outputs

- `sklearn_calibrated_model` (object): Path to `models/calibrated.joblib`, the method, the fitting mode, the scikit-learn version, and before/after Brier score, log loss and ECE on held-out rows, plus the ranking metric before and after.

---

## Phase 1: Choose Method and Mode

### Entry Criteria
- `calibration_report.decision` is `calibrate`. If `skip`, return the uncalibrated model path as `sklearn_calibrated_model` with reason "skip" and finish.

### Actions
1. Method:

| Condition | `method` |
|---|---|
| Calibration rows are few. The scikit-learn user guide warns that isotonic regression tends to overfit with small calibration sets and advises it mainly when there are many samples (it cites roughly a thousand or more); treat a set below that guidance as small | `"sigmoid"` |
| Calibration rows are many and the reliability curve is non-monotone or S-shaped in a way a sigmoid cannot fit | `"isotonic"` |
| Multiclass with a neural-network-like model and your scikit-learn version lists `"temperature"` in the `CalibratedClassifierCV` docs | `"temperature"` (check the docs; older versions do not have it) |
| Otherwise | `"sigmoid"` |

2. Mode:

| Situation | Mode |
|---|---|
| Cheap to refit the pipeline k times | Cross-fitted: `CalibratedClassifierCV(estimator=unfitted_pipe, method=m, cv=project_cv(split_manifest), ensemble=True)` (`ensemble=True` is the default) fit on train + validation |
| Expensive to refit, or the model is already final | Prefit: fit only the calibrator on validation rows the model never saw. scikit-learn 1.6 and later: `CalibratedClassifierCV(FrozenEstimator(fitted_model), method=m)` with `from sklearn.frozen import FrozenEstimator`. Earlier versions: `cv="prefit"` (deprecated in 1.6). |

3. Prefit with a model refit on train + validation is wrong: the calibrator would see rows the model trained on. In prefit mode, use the model fit on TRAIN ONLY (from `mlp-optuna-search` Phase 3 step 3) and calibrate on validation.

### Output
Method, mode and the model object to wrap.

### Quality Gate
- Method and mode name their table rows.
- In prefit mode, the wrapped model's training row IDs and the calibration row IDs have an empty intersection (print the count).

---

## Phase 2: Fit the Calibrator

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Fit per the mode. For grouped splits in cross-fitted mode, the saved folds from `project_cv` already respect groups.
2. Save `joblib.dump(cal, "models/calibrated.joblib")`.
3. `predict_proba` of the calibrated object returns calibrated probabilities; `predict` uses argmax and may change labels slightly with isotonic.
4. Do not tune the calibration method on test. Choose by the Phase 1 table only.

### Output
`models/calibrated.joblib`.

### Quality Gate
- `joblib.load("models/calibrated.joblib").predict_proba(X_val[:5])` returns a 5-row array whose rows sum to 1.

---

## Phase 3: Verify Improvement

### Entry Criteria
- Calibrated model saved.

### Actions
1. Choose held-out rows the calibrator never saw: in cross-fitted mode, nested out-of-fold predictions; in prefit mode, a second half of validation held aside before Phase 2, or the test set once for the final report only.
2. Compute Brier, log loss and ECE (same binning as `calibration_report`) before and after.
3. Compute the ranking metric (ROC AUC or AP) before and after. Sigmoid and temperature are monotonic, so ranking is unchanged; isotonic produces ties that can move ranking metrics slightly. Record the change.
4. Rule: if Brier and log loss did not decrease, keep the uncalibrated model and record "calibration did not help".

### Output
`sklearn_calibrated_model`.

### Quality Gate
- Before/after Brier, log loss and ECE are recorded on rows the calibrator did not fit.
- For `sigmoid`, ROC AUC before and after are equal to the printed digits.

---

## Worked Example

Illustrative only.

Input: `calibration_report` says `calibrate`, shape "too extreme", 150,000 validation rows; scikit-learn 1.6; refit is expensive.

```
method: isotonic (many rows, S-shaped curve)   mode: prefit with FrozenEstimator
train/calibration row overlap: 0
held-out half of validation (75,000 rows):
            brier    log_loss  ece(10,q)  roc_auc
before      0.0352   0.1291    0.0118     0.8611
after       0.0341   0.1240    0.0031     0.8609
```
Calibration kept.

---

## Exit Criteria

DONE when the method and mode follow the tables, the calibrator never saw the model's training rows, and improvement is shown on rows the calibrator did not fit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ImportError: sklearn.frozen` | **Adjust**: scikit-learn is older than 1.6; use `cv="prefit"`. |
| Phase 1 | Only a model refit on train + val exists | **Adjust**: refit on train only for prefit mode, or use cross-fitted mode. |
| Phase 2 | Isotonic gives step-like probabilities with few distinct values | **Adjust**: switch to `sigmoid`; record why. |
| Phase 3 | Brier gets worse | **Return**: keep the uncalibrated model and record it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
