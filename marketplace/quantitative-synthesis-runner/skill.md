# Quantitative Synthesis Runner

Pool extracted results quantitatively: calculate summary effect sizes, test heterogeneity, and generate forest plots.

## Inputs

- `extraction-table`: extracted outcome data per study
- `bias-assessment-table`: per-study bias ratings for sensitivity analysis

## Outputs

- `pooled-estimate`: summary effect size with confidence interval
- `heterogeneity-statistics`: I-squared, Q statistic, tau-squared
- `forest-plot`: forest plot showing individual and pooled estimates

## Process

1. Select the effect measure (odds ratio, risk ratio, mean difference, standardized mean difference)
2. Choose fixed-effect or random-effects model based on expected heterogeneity
3. Run the meta-analysis and compute I-squared, Q, and tau-squared
4. Generate the forest plot and run pre-planned subgroup or sensitivity analyses

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
