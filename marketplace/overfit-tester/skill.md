# Overfit Tester

Test the selected model for overfitting: compare training performance to CV performance, check learning curves, and assess stability across folds.

## Inputs

- `fold-scores`: Validation scores
- `training-diagnostics`: Training-set performance and fitting issues

## Outputs

- `overfit-assessment`: Whether overfitting is present and its severity
- `learning-curve`: Performance as a function of training set size

## Process

1. Compare the average training error to the average validation error for the top model.
2. If the gap is large, overfitting is likely: consider regularization or a simpler model.
3. Plot the learning curve: re-train with increasing fractions of the data and track validation error.
4. Check fold-to-fold stability: high variance across folds suggests sensitivity to the training sample.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
