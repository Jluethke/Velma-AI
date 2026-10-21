# Publication Bias Tester

Formally test for publication bias using statistical tests and trim-and-fill analysis.

## Inputs

- `effect-size-table`: per-study effect sizes and variances
- `funnel-plot`: visual assessment of funnel asymmetry

## Outputs

- `bias-test-results`: Egger test, Begg test, and trim-and-fill adjusted estimate
- `bias-interpretation`: plain-language interpretation of publication bias risk

## Process

1. Run Egger's regression test for funnel plot asymmetry
2. Run Begg's rank correlation test as a complement
3. Apply trim-and-fill to estimate the bias-adjusted pooled effect
4. Interpret the results in context of the number of studies and heterogeneity

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
