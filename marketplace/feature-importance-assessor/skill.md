# Feature Importance Assessor

Assess feature importance and remove redundant or irrelevant features.

## Inputs

- `feature-matrix`: Computed feature matrix
- `target-variable`: The prediction target

## Outputs

- `importance-ranking`: Features ranked by importance score
- `correlation-matrix`: Pairwise correlation between features

## Process

1. Compute univariate importance (mutual information, chi-squared, ANOVA F-test).
2. Run a tree-based model and extract feature importances.
3. Compute pairwise correlations and flag highly correlated pairs.
4. Remove features with near-zero variance or near-perfect correlation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
