# Interpolation Execution

Run the selected interpolation to generate a continuous raster surface over the study area.

## Inputs

- `selected-method`: Interpolation method and parameters
- `projected-point-dataset`: Input sample points
- `study-area-boundary`: Area to fill

## Outputs

- `interpolated-surface`: Raster grid of predicted values
- `prediction-uncertainty`: Kriging variance or other uncertainty surface if available

## Process

1. Define the output raster grid resolution based on sample density and analysis needs.
2. Run the interpolation algorithm over the study area.
3. If kriging, also generate the kriging variance surface as a measure of prediction uncertainty.
4. Clip the output to the study area boundary.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
