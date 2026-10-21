# Spatial Interpolation Report

Produce the interpolation map, uncertainty surface, and report documenting methods, validation, and results.

## Inputs

- `interpolated-surface`: Predicted value raster
- `prediction-uncertainty`: Uncertainty surface
- `cross-validation-metrics`: Accuracy assessment

## Outputs

- `interpolation-map`: Final map with contours, color ramp, and legend
- `interpolation-report`: Report with methods, variogram, validation, and interpretation

## Process

1. Generate the final map with appropriate color ramp, contour lines, and legend.
2. Overlay the uncertainty surface to show where predictions are most and least reliable.
3. Write the methods section covering data sources, variogram modeling, interpolation, and validation.
4. Discuss cross-validation results and state the spatial resolution and confidence of the predictions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
