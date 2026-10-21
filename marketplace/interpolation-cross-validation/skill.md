# Interpolation Cross Validation

Validate the interpolation using leave-one-out cross-validation to assess prediction accuracy.

## Inputs

- `selected-method`: Method and parameters to validate
- `projected-point-dataset`: All sample points for cross-validation

## Outputs

- `cross-validation-metrics`: RMSE, MAE, mean error, and R-squared from leave-one-out
- `residual-map`: Spatial distribution of prediction errors

## Process

1. For each sample point, remove it, interpolate from remaining points, and record the prediction error.
2. Compute summary error metrics: RMSE, MAE, mean error (bias), and R-squared.
3. Map residuals spatially to check for systematic patterns in the errors.
4. If errors show spatial patterns, revisit the variogram or method choice.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
