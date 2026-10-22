# Algorithm Selector

Select candidate algorithms based on the problem type and data characteristics.

## Inputs

- `train-set`: Training data to evaluate algorithms on
- `problem-type`: Classification, regression, ranking, or clustering

## Outputs

- `candidate-algorithms`: List of algorithms to evaluate
- `baseline-scores`: Baseline performance for each candidate

## Process

1. Classify the problem type and select appropriate algorithm families.
2. Run each candidate with default parameters on a validation fold.
3. Record baseline scores (accuracy, RMSE, AUC depending on problem type).
4. Select the top candidates for hyperparameter tuning.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
