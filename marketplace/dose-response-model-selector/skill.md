# Dose Response Model Selector

Evaluate candidate dose-response models and select the best fit using information criteria and residual diagnostics.

## Inputs

- `cleaned-data`: Validated dose-response dataset
- `shape-assessment`: Visual assessment from the curve plot

## Outputs

- `selected-dr-model`: Best-fit model type with initial parameter estimates
- `model-comparison`: AIC, BIC, and residual diagnostics for each candidate

## Process

1. Define candidate models (4-parameter logistic, Hill, linear-quadratic, probit).
2. Fit each candidate to the data using nonlinear least squares or maximum likelihood.
3. Compare by AIC, BIC, and residual patterns.
4. Select the model with the best balance of fit and parsimony.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
