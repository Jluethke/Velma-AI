# Metric Comparator

Compare models across folds: compute mean and standard error of each model's score, test for significant differences, and rank.

## Inputs

- `fold-scores`: Models-by-folds score matrix
- `comparison-criteria`: Which metrics to use

## Outputs

- `model-ranking`: Models ordered by mean CV score with standard errors
- `pairwise-tests`: Statistical tests for whether the top models differ significantly

## Process

1. Compute the mean and standard error of each model's scores across folds.
2. Rank models by mean score (lower is better for error metrics, higher for R-squared).
3. Run a paired test (paired t-test or Wilcoxon signed-rank) between the top two models.
4. If the difference is not significant, prefer the simpler model.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
