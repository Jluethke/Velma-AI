# Causal Analysis Executor

Run the selected causal analysis and compute the estimated treatment effect.

## Inputs

- `available-data`: the dataset
- `identification-strategy`: method and specification
- `causal-estimand`: target effect to estimate

## Outputs

- `causal-estimate`: point estimate, standard error, confidence interval, p-value
- `balance-diagnostics`: covariate balance before and after adjustment (for matching/weighting)

## Process

1. Implement the method: fit the regression, estimate propensity scores, compute weights, or find the RD cutoff
2. Compute the treatment effect estimate with appropriate standard errors (heteroscedasticity-consistent, clustered, or bootstrap)
3. For matching/weighting, check covariate balance (standardized mean differences, QQ plots)
4. Report the estimate with its uncertainty

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
