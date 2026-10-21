# Reliability Coefficient Calculator

Compute the inter-rater agreement coefficient: Cohen's kappa for two raters, Fleiss' kappa or Krippendorff's alpha for multiple raters.

## Inputs

- `rater-code-matrix`: Raters' codes for each unit
- `code-measurement-level`: Nominal, ordinal, interval, or ratio level of the codes

## Outputs

- `agreement-coefficient`: The computed reliability statistic with confidence interval
- `coefficient-interpretation`: What the value means relative to field benchmarks

## Process

1. Select the appropriate coefficient based on number of raters and measurement level.
2. Compute the observed agreement and the expected agreement by chance.
3. Calculate the coefficient and its confidence interval.
4. Interpret the result using established benchmarks (e.g., Landis and Koch for kappa).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
