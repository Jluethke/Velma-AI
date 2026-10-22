# Model Evaluator

Evaluate the trained model on the held-out test set.

## Inputs

- `trained-model`: The trained model
- `test-set`: Held-out test data

## Outputs

- `evaluation-metrics`: Performance metrics on the test set
- `error-analysis`: Analysis of where the model fails

## Process

1. Run predictions on the test set.
2. Compute metrics: accuracy, precision, recall, F1, AUC (classification) or RMSE, MAE, R-squared (regression).
3. Generate confusion matrix or residual plots.
4. Analyze error patterns by segment or feature range.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
