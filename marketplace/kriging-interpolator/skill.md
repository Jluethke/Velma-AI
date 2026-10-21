# Kriging Interpolator

Interpolate the measured values across the study region using ordinary or universal kriging, producing predictions and kriging variance at unsampled locations.

## Inputs

- `projected-dataset`: Observations with coordinates and values
- `fitted-variogram`: The variogram model to use for kriging weights

## Outputs

- `prediction-surface`: Interpolated values on a regular grid covering the study region
- `kriging-variance`: Prediction uncertainty at each grid cell

## Process

1. Define the prediction grid covering the study region at the desired resolution.
2. For each grid cell, solve the kriging system to obtain weights for nearby observations.
3. Compute the kriging prediction (weighted combination of nearby observations).
4. Compute the kriging variance (prediction uncertainty that increases away from data points).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
