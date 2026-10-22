# Feature Computation Engine

Compute the candidate features from raw data.

## Inputs

- `raw-dataset`: The raw dataset
- `candidate-features`: List of features to compute

## Outputs

- `feature-matrix`: Computed feature matrix
- `computation-log`: Log of how each feature was computed

## Process

1. Compute aggregation features (counts, sums, averages by group).
2. Compute ratio and interaction features.
3. Compute time-based features (lags, rolling statistics, time since event).
4. Log the computation method for each feature for reproducibility.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
