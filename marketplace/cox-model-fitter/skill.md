# Cox Model Fitter

Fit a Cox proportional hazards model with covariates and report hazard ratios.

## Inputs

- `survival-dataset`: Time, event indicator, and covariate columns
- `covariate-list`: List of covariates to include in the model

## Outputs

- `cox-model`: Fitted Cox model with hazard ratios, confidence intervals, and p-values
- `cox-summary`: Model concordance, likelihood ratio test, and covariate effect table

## Process

1. Fit the Cox proportional hazards model using partial likelihood.
2. Compute hazard ratios and 95% confidence intervals for each covariate.
3. Report the concordance index (C-statistic) for discrimination.
4. Perform the likelihood ratio test for overall model significance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
