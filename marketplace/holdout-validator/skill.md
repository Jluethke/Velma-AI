# Holdout Validator

Validate the forecast against held-out data: compare predictions to actuals, compute accuracy metrics, and assess whether the model is trustworthy.

## Inputs

- `forecast`: The model's predictions
- `holdout-data`: Actual values for the forecast period, withheld during fitting

## Outputs

- `validation-metrics`: MAE, RMSE, MAPE, and coverage of prediction intervals
- `model-assessment`: Whether the model's forecasts are reliable enough for the intended use

## Process

1. Align forecast points with held-out actuals by timestamp.
2. Compute point accuracy metrics (MAE, RMSE, MAPE).
3. Compute interval coverage: what fraction of actuals fell within the prediction intervals.
4. Assess whether performance is adequate for the decision the forecast will inform.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
