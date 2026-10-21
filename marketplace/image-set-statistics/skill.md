# Image Set Statistics

Compute summary statistics across the entire image set: per-image and per-group means, variance, and comparisons.

## Inputs

- `classified-objects`: Object-level classifications across all images
- `experimental-groups`: Which images belong to which experimental condition

## Outputs

- `group-statistics`: Per-group summary (means, SDs, medians) for each measured feature
- `group-comparison`: Statistical test results comparing groups (t-test, ANOVA, or nonparametric)

## Process

1. Aggregate object-level measurements to per-image summaries.
2. Compute group-level means, standard deviations, and medians.
3. Test for group differences using appropriate statistical tests.
4. Report effect sizes and confidence intervals alongside p-values.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
