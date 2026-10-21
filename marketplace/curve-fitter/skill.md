# Curve Fitter

Fit each candidate model to the data using nonlinear least squares or maximum likelihood, reporting parameter estimates with standard errors.

## Inputs

- `organized-data`: Cleaned dose-response data
- `candidate-models`: Models and initial guesses

## Outputs

- `fit-results`: For each model: parameter estimates, standard errors, and goodness-of-fit statistics
- `convergence-log`: Whether each fit converged and any issues encountered

## Process

1. Fit each candidate model using weighted nonlinear least squares (weights from replicate variance).
2. Record parameter estimates, their standard errors, and confidence intervals.
3. Compute goodness-of-fit: R-squared, residual standard error, AIC, and BIC.
4. Check convergence and parameter identifiability (are confidence intervals finite?).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
