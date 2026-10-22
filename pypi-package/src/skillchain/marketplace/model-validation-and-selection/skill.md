# Model Validation and Selection

Validate fitted models against held-out data not used in parameter estimation. Cross-validate across operating conditions. Select the model with the best prediction accuracy at the lowest complexity.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load fitted models and held-out validation data
REASON  --> Predict on validation set, compare to actual
PLAN    --> Rank by validation fit, select best via AIC
ACT     --> Output selected model and validation report
```

## Inputs

- `fitted_models`: list[object] -- Candidate models with estimated parameters from parameter-estimation
- `conditioned_data`: object -- Full dataset including the held-out validation portion (30%)

## Outputs

- `selected_model`: object -- The best model: parameters, confidence intervals, valid operating range, fit metrics on both identification and validation sets
- `validation_report`: object -- Prediction accuracy on held-out data per operating region, overfit detection, comparison table across all candidates

---

## Execution

### OBSERVE: Prepare Validation

1. Extract the held-out validation set (the 30% not used for parameter estimation).
2. Segment validation data by operating region (low/mid/high input range) to test generalization.
3. For each fitted model, prepare the prediction function.

### REASON: Predict and Compare

1. **Simulate each model on validation data.** Feed the actual input sequence from the validation set. Compare predicted output to actual output.
2. **Compute validation fit percentage** per model: `100 * (1 - norm(predicted - actual) / norm(actual - mean(actual)))`.
3. **Detect overfit.** A model that fits well on identification (>90%) but poorly on validation (<60%) is overfit. Flag it.
4. **Cross-validate across operating regions.** For each region, compute the fit percentage separately. A model that works well at low input but poorly at high input has limited validity.

### PLAN: Select

1. **Rank by validation fit.** The model with the highest validation fit is the best predictor.
2. **Break ties with complexity.** If two models have similar validation fit (within 5%), select the simpler one (fewer parameters). Use AIC for the formal comparison.
3. **Define the valid operating range.** The input range where validation fit exceeds 70%. Outside this range, the model's predictions are unreliable.
4. **Compute confidence intervals.** For each model parameter, derive the 95% confidence interval from the covariance matrix.

### ACT: Deliver

1. Output the selected model with full specification: structure, parameters, confidence intervals, valid operating range.
2. Output the validation report: comparison table of all candidates, per-region fit percentages, overfit flags.

## Exit Criteria

1. At least one model has validation fit > 60%
2. The valid operating range is defined
3. The comparison table covers all candidates

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
