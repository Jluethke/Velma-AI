# Pooled Analysis Runner

Run the meta-analytic model (fixed or random effects) and compute the pooled estimate with confidence intervals.

## Inputs

- `effect-size-table`: per-study effect sizes and variances
- `model-recommendation`: selected model type and estimator

## Outputs

- `pooled-result`: pooled effect size, 95% CI, p-value, and prediction interval
- `study-weights`: weight assigned to each study under the model

## Process

1. Apply the selected model (inverse-variance, DerSimonian-Laird, REML, or Hartung-Knapp)
2. Compute the pooled estimate, standard error, and 95% CI
3. Calculate each study's weight and its percentage contribution
4. Run leave-one-out sensitivity analysis to test stability

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
