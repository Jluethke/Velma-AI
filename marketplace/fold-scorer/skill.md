# Fold Scorer

Train each candidate model on each training fold and score it on the corresponding validation fold.

## Inputs

- `candidate-list`: Models to evaluate
- `fold-assignments`: The cross-validation folds

## Outputs

- `fold-scores`: Each model's score on each fold
- `training-diagnostics`: Any convergence warnings, singular fits, or other issues per model per fold

## Process

1. For each fold, fit each candidate model to the training portion.
2. Predict the validation portion and compute the comparison metric.
3. Record any fitting issues (non-convergence, singular Hessian, boundary estimates).
4. Store all scores in a models-by-folds matrix.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
