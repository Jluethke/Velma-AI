# Sensor Noise Characterizer

Characterize each sensor's noise: estimate its variance, spectral profile, and any systematic biases.

## Inputs

- `aligned-data`: Time-aligned sensor streams
- `reference-data`: A known reference or a period where the true value is constant, if available

## Outputs

- `noise-profiles`: Each sensor's noise variance, spectral shape, and bias estimate
- `correlation-matrix`: Cross-correlation between sensor noise terms

## Process

1. If reference data is available, compute residuals (sensor minus reference) to estimate noise.
2. If no reference, use Allan variance or difference-based methods on static periods.
3. Estimate the noise power spectrum to identify if noise is white, pink, or has specific features.
4. Compute cross-correlations between sensor errors to detect common-mode noise.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
