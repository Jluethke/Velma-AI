# Data Split Strategist

Split data into train, validation, and test sets with proper stratification.

## Inputs

- `feature-set`: The prepared feature set
- `split-strategy`: How to split (random, temporal, group-based)

## Outputs

- `train-set`: Training data partition
- `test-set`: Held-out test partition

## Process

1. Select the split strategy based on data characteristics (random, time-based, group).
2. Apply stratification to preserve class distribution.
3. Verify no data leakage between splits.
4. Document the split ratios and random seeds for reproducibility.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
