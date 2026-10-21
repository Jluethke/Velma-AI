# Proteomics Differential Expression

Test for differentially expressed proteins between experimental conditions.

## Inputs

- `normalized-abundances`: Normalized protein abundance matrix
- `experimental-design`: Sample group assignments and covariates

## Outputs

- `de-results`: Proteins with fold change, p-value, and adjusted p-value
- `volcano-plot-data`: Data for volcano plot visualization

## Process

1. Fit a linear model for each protein with condition as the main factor.
2. Apply empirical Bayes moderation of variance (limma-style).
3. Correct for multiple testing using Benjamini-Hochberg FDR.
4. Flag proteins meeting both fold-change and adjusted p-value thresholds.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
