# Fusion Weight Calculator

Compute the optimal fusion weights for each sensor based on their noise characteristics: lower noise earns higher weight.

## Inputs

- `noise-profiles`: Each sensor's noise variance and spectral profile
- `correlation-matrix`: Cross-correlations between sensor noise

## Outputs

- `fusion-weights`: Optimal weight for each sensor, possibly varying with frequency or time
- `expected-fused-variance`: The predicted variance of the fused estimate

## Process

1. Compute minimum-variance weights: inversely proportional to noise variance (for uncorrelated sensors).
2. If sensors are correlated, use the full covariance matrix for the weight calculation.
3. If noise profiles are frequency-dependent, compute frequency-dependent weights.
4. Calculate the expected variance of the fused output to confirm improvement over any single sensor.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
