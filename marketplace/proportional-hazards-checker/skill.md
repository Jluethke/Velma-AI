# Proportional Hazards Checker

Verify the proportional hazards assumption using Schoenfeld residuals and log-log plots.

## Inputs

- `cox-model`: Fitted Cox model
- `survival-dataset`: Original survival dataset

## Outputs

- `ph-test-results`: Schoenfeld residual test p-values for each covariate and global test
- `diagnostic-plots`: Schoenfeld residual plots and log-log survival plots

## Process

1. Compute scaled Schoenfeld residuals for each covariate.
2. Test the correlation of residuals with time (Grambsch-Therneau test).
3. Generate log-log survival plots for categorical covariates.
4. Identify covariates that violate the assumption and suggest remedies (stratification or time interaction).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
