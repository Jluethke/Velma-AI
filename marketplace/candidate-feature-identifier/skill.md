# Candidate Feature Identifier

Identify candidate features from domain knowledge and data patterns.

## Inputs

- `data-profile`: Statistical profile of the dataset
- `domain-context`: Domain knowledge about what signals matter

## Outputs

- `candidate-features`: List of candidate features with rationale
- `feature-hypotheses`: Hypotheses about which features will be predictive

## Process

1. List features suggested by domain knowledge and prior research.
2. Identify potential interaction terms and polynomial features.
3. Define time-based features (lags, rolling windows, trends) if applicable.
4. Document the rationale for each candidate feature.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
