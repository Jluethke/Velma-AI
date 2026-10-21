# Distribution Model Fitter

Fit a parametric distribution model to the data to describe the particle population.

## Inputs

- `cumulative-distribution`: Measured cumulative distribution data
- `distribution-metrics`: D50 and span as initial parameter estimates

## Outputs

- `fitted-model`: Best-fit distribution parameters (log-normal: mu and sigma; Rosin-Rammler: d and n)
- `goodness-of-fit`: R-squared, residuals, and whether the model adequately describes the data

## Process

1. Select candidate models (log-normal, Rosin-Rammler, bimodal)
2. Fit each model to the cumulative distribution by least squares
3. Compare goodness of fit and select the best model
4. Report the fitted parameters and their physical meaning

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
