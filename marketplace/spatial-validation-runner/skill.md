# Spatial Validation Runner

Validate the spatial model using leave-one-out cross-validation: compare predicted values to withheld observations and compute accuracy metrics.

## Inputs

- `projected-dataset`: All observations
- `fitted-variogram`: The variogram model

## Outputs

- `cv-metrics`: Mean error, mean absolute error, RMSE, and standardized prediction error
- `cv-diagnostics`: Scatter plot of predicted vs. observed and spatial map of residuals

## Process

1. Remove one observation at a time and predict its value from the remaining data.
2. Compute the prediction error and the standardized error (error / kriging standard deviation).
3. Calculate summary metrics: ME (should be near zero), MAE, RMSE.
4. Check that standardized errors have mean near 0 and variance near 1 (model is well-calibrated).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
