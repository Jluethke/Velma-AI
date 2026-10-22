# Drift Metric Definer

Define the metrics to monitor for prediction, feature, and concept drift.

## Inputs

- `model-info`: The deployed model and its training data characteristics
- `business-metrics`: Business metrics tied to model performance

## Outputs

- `drift-metrics`: Defined drift metrics and their calculation methods
- `reference-distributions`: Training data distributions for comparison

## Process

1. Define prediction drift metrics (output distribution shift, confidence score changes).
2. Define feature drift metrics (input distribution shift per feature).
3. Define concept drift indicators (performance degradation on labeled samples).
4. Store the training data distributions as the reference baseline.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
