# Age Model Execution

Run the age-depth model and extract the chronology with confidence intervals.

## Inputs

- `calibrated-dates`: Input dates for the model
- `model-configuration`: Model type and parameters
- `outlier-decisions`: Outlier handling instructions

## Outputs

- `age-depth-model`: Median age and 95% confidence interval at every depth increment
- `accumulation-rate`: Sedimentation rate profile with uncertainty over the core length

## Process

1. Run the model with the configured parameters (MCMC iterations for Bayesian models)
2. Check convergence diagnostics (trace plots, Gelman-Rubin statistic)
3. Extract the median age and 95% credible interval at each depth step
4. Compute the sediment accumulation rate as the inverse of the age-depth slope

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
