# Spatial Interpolator

Estimate values at unsampled locations using kriging, inverse distance weighting, or spline interpolation.

## Inputs

- `projected-data`: Sample point data with measured values
- `interpolation-method`: Kriging variant, IDW, or spline
- `prediction-grid`: Grid resolution and extent for output surface

## Outputs

- `interpolated-surface`: Raster of predicted values across the study area
- `prediction-uncertainty`: Kriging variance or cross-validation error map

## Process

1. Fit the variogram model (for kriging) or set the IDW power parameter.
2. Generate predictions at each grid cell.
3. Compute prediction uncertainty at each cell.
4. Run leave-one-out cross-validation and report RMSE.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
