# Spatial Validation

Validate the spatial analysis using holdout sample points and compare predicted vs. observed values.

## Inputs

- `interpolated-surface`: Predicted value raster
- `holdout-points`: Withheld sample locations with known values

## Outputs

- `validation-metrics`: RMSE, MAE, R-squared, and bias at holdout points
- `residual-map`: Map of prediction errors at holdout locations

## Process

1. Extract predicted values at each holdout location.
2. Compute error metrics (RMSE, MAE, R-squared, mean bias).
3. Map the residuals to check for spatial patterns in the errors.
4. Flag regions where prediction error exceeds an acceptable threshold.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
