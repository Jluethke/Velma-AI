# Fluorescence Decay Fitter

Fit fluorescence lifetime decay curves to single or multi-exponential models.

## Inputs

- `decay-curves`: Time-resolved fluorescence intensity data per sample
- `instrument-response-function`: IRF measured under the same conditions

## Outputs

- `lifetime-fit-results`: Fitted lifetimes, amplitudes, and chi-squared per model per sample
- `residuals`: Weighted residuals and autocorrelation for fit quality assessment

## Process

1. Convolve candidate decay models with the IRF for iterative reconvolution fitting
2. Fit one-exponential, two-exponential, and stretched-exponential models
3. Select the best model by reduced chi-squared, residual randomness, and Durbin-Watson statistic
4. Report lifetimes and fractional amplitudes with confidence intervals

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
