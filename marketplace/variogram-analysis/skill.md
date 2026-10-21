# Variogram Analysis

Explore spatial autocorrelation by computing and modeling the experimental variogram.

## Inputs

- `projected-point-dataset`: Georeferenced sample points with measured values
- `coverage-assessment`: Information about sample distribution

## Outputs

- `variogram-model`: Fitted variogram model (spherical, exponential, Gaussian) with sill, range, and nugget
- `spatial-correlation-summary`: Description of how the variable changes with distance

## Process

1. Compute the experimental variogram at multiple lag distances.
2. Test directional variograms to check for anisotropy.
3. Fit theoretical variogram models (spherical, exponential, Gaussian) and select by least squares.
4. Extract the nugget (measurement noise), sill (total variance), and range (correlation distance).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
