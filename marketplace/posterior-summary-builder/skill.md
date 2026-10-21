# Posterior Summary Builder

Summarize the posterior with point estimates, credible intervals, posterior predictive checks, and model comparison metrics.

## Inputs

- `posterior-samples`: converged posterior draws
- `observed-data`: the original dataset for posterior predictive checks

## Outputs

- `posterior-summary-table`: mean, median, SD, and 95% credible interval per parameter
- `posterior-predictive-check`: comparison of simulated data from the posterior vs observed data
- `model-comparison`: LOO-CV, WAIC, or Bayes factor if comparing models

## Process

1. Compute posterior mean, median, standard deviation, and highest density interval (HDI) per parameter
2. Generate posterior predictive samples and compare distributions, test statistics, or plots against observed data
3. Compute LOO-CV (PSIS-LOO) or WAIC for model comparison if multiple models are fitted
4. Tabulate results in a standard format

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
