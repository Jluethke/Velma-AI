# Niche Model Evaluator

Evaluate model performance using discrimination and calibration metrics.

## Inputs

- `trained-model`: Fitted niche model
- `clean-occurrences`: Occurrence records with cross-validation folds

## Outputs

- `evaluation-metrics`: AUC, TSS, Boyce index, and calibration statistics
- `threshold-selection`: Binary threshold chosen and its justification

## Process

1. Compute AUC and TSS from cross-validation predictions
2. Assess calibration with the continuous Boyce index
3. Select the binary threshold (maximum TSS, equal sensitivity-specificity, or fixed sensitivity)
4. Compare performance across cross-validation folds to assess stability

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
