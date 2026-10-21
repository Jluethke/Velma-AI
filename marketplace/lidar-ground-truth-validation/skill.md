# Lidar Ground Truth Validation

Validate the lidar products against independently measured ground truth.

## Inputs

- `digital-terrain-model`: DTM to validate
- `extracted-features`: Extracted features to validate
- `ground-truth-data`: Field measurements, survey points, or reference datasets

## Outputs

- `validation-results`: Error statistics: RMSE, bias, and R-squared for terrain and features
- `error-map`: Spatial distribution of errors across the study area

## Process

1. Match ground truth points to the corresponding DTM cells and extracted feature locations
2. Compute the signed error (lidar minus ground truth) at each validation point
3. Calculate summary error statistics: mean error, RMSE, median absolute error, R-squared
4. Map the spatial pattern of errors to identify systematic biases (slope, land cover, scan angle)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
