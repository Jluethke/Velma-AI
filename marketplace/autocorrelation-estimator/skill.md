# Autocorrelation Estimator

Estimate spatial autocorrelation in the measured values: compute the variogram, fit a variogram model, and extract range, sill, and nugget parameters.

## Inputs

- `projected-dataset`: Observations with coordinates and measured values
- `lag-parameters`: Maximum lag distance, bin width, and directional anisotropy checks

## Outputs

- `empirical-variogram`: Semivariance vs. lag distance with bin counts
- `fitted-variogram`: Model parameters: nugget, sill, range, and model type (spherical, exponential, Gaussian)

## Process

1. Compute the empirical variogram: mean squared differences of pairs at each lag bin.
2. Check for anisotropy by computing directional variograms.
3. Fit candidate variogram models (spherical, exponential, Gaussian) using weighted least squares.
4. Select the best model and extract the nugget (measurement error), sill (total variance), and range (correlation distance).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
