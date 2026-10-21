# Data Splitter

Split the data for cross-validation: choose k-fold, leave-one-out, or time-series split, and create the folds.

## Inputs

- `data-description`: Sample size and data structure
- `candidate-list`: Models to evaluate (determines computational budget)

## Outputs

- `fold-assignments`: Which observations belong to which fold
- `split-rationale`: Why this splitting strategy was chosen

## Process

1. Choose the CV strategy: k-fold for standard data, time-series split for temporal data, leave-one-out for very small samples.
2. Determine k based on sample size and computational budget.
3. If data has groups (e.g., patients with multiple measurements), use group-aware splitting.
4. Generate the fold assignments and verify that each fold has a representative distribution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
