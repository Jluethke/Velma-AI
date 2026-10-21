# Heterogeneity Assessor

Test whether the included studies are estimating the same underlying effect or differ meaningfully.

## Inputs

- `effect-size-table`: per-study effect sizes and variances

## Outputs

- `heterogeneity-report`: I-squared, Q statistic (with p-value), tau-squared, and prediction interval
- `model-recommendation`: fixed-effect or random-effects recommendation with rationale

## Process

1. Compute Cochran Q statistic and its p-value
2. Calculate I-squared (proportion of variability due to heterogeneity vs sampling error)
3. Estimate tau-squared (between-study variance) and the prediction interval
4. Recommend fixed-effect or random-effects model based on the heterogeneity profile

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
