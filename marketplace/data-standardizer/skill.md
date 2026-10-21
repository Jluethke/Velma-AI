# Data Standardizer

Standardize and normalize the input features so no single variable dominates the decomposition by scale alone.

## Inputs

- `raw-feature-matrix`: observations-by-features data matrix
- `feature-metadata`: variable types, units, and expected ranges

## Outputs

- `standardized-matrix`: z-scored or min-max-normalized feature matrix
- `scaling-parameters`: means, standard deviations, or min/max used for each feature

## Process

1. Identify feature types (continuous, ordinal, binary) and handle each appropriately
2. Apply z-score standardization for continuous features (subtract mean, divide by SD)
3. Log-transform or rank-transform heavily skewed features before standardizing
4. Record the scaling parameters so new data can be projected into the same space

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
