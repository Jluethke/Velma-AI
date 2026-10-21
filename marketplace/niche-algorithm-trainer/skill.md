# Niche Algorithm Trainer

Train the niche model using the selected algorithm and occurrence data.

## Inputs

- `clean-occurrences`: Filtered occurrence records
- `predictor-stack`: Environmental predictor layers

## Outputs

- `trained-model`: Fitted niche model object or parameter set
- `variable-importance`: Ranked contribution of each predictor to the model

## Process

1. Generate background or pseudo-absence points using an appropriate strategy
2. Partition the data for cross-validation (spatial blocks to avoid spatial autocorrelation)
3. Fit the model (MaxEnt, BRT, or random forest) with tuned hyperparameters
4. Extract variable importance scores and partial response curves

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
