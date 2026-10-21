# Cross Sample Cytometry Comparator

Compare population statistics across experimental groups.

## Inputs

- `statistics-table`: Summary statistics for all samples
- `experimental-design`: Group assignments and covariates

## Outputs

- `comparison-results`: Statistical test results (p-values, effect sizes) for group comparisons
- `significant-differences`: Populations and markers with statistically significant differences

## Process

1. Assign samples to groups according to the experimental design
2. Select the appropriate statistical test (t-test, ANOVA, Mann-Whitney) based on distribution and sample size
3. Correct for multiple comparisons (Bonferroni or Benjamini-Hochberg)
4. Flag populations and markers with significant differences

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
