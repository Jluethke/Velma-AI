# Metabolomics Multivariate Analyzer

Run multivariate statistical analysis on the metabolomics data to identify group-level patterns and significant metabolites.

## Inputs

- `annotated-feature-table`: Normalized and annotated feature matrix
- `sample-metadata`: Group assignments and covariates for each sample

## Outputs

- `multivariate-results`: PCA scores, PLS-DA model, VIP scores, and permutation test results
- `significant-metabolites`: List of metabolites driving group separation with fold change and adjusted p-value

## Process

1. Normalize (total ion current, probabilistic quotient), log-transform, and scale (Pareto or auto)
2. Run unsupervised PCA to check for outliers and batch effects
3. Run supervised PLS-DA and validate with permutation testing and cross-validation
4. Extract VIP scores and run univariate tests (t-test, Wilcoxon) with FDR correction

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
