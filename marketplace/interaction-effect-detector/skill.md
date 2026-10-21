# Interaction Effect Detector

Identify and quantify interaction effects between parameters that jointly influence the output.

## Inputs

- `sensitivity-indices`: First-order and total-effect indices
- `model-outputs`: Full output dataset from sample runs

## Outputs

- `interaction-pairs`: Parameter pairs with significant interaction effects and their second-order indices
- `interaction-plots`: Scatter or heatmap plots showing the joint effect of interacting parameter pairs

## Process

1. Compute second-order Sobol indices for parameter pairs (or infer interactions from total minus first-order gap).
2. Identify pairs where the interaction index exceeds a threshold.
3. Generate joint-effect plots for the top interacting pairs.
4. Summarize the fraction of output variance due to interactions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
