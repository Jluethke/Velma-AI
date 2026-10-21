# Light Curve Model Fitter

Fit a physical model to the light curve (transit, eclipsing binary, pulsation, or transient decay).

## Inputs

- `light-curve`: Time-series of calibrated magnitudes
- `model-type`: The type of model to fit (transit, eclipse, sinusoidal, exponential)

## Outputs

- `best-fit-parameters`: Fitted model parameters with uncertainties
- `model-comparison`: Residuals, reduced chi-squared, and BIC for model comparison

## Process

1. Select the physical model appropriate to the variability type
2. Fit the model using least-squares or MCMC sampling
3. Compute parameter uncertainties from the posterior or covariance matrix
4. Compare the fit residuals to the photometric uncertainties

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
