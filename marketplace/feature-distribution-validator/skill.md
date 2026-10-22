# Feature Distribution Validator

Validate feature distributions on train vs test and produce the report.

## Inputs

- `clean-feature-matrix`: Cleaned feature matrix
- `computation-log`: How each feature was computed

## Outputs

- `feature-engineering-report`: Final feature engineering report
- `validated-feature-set`: Final validated feature set ready for modeling

## Process

1. Split into train and test sets and compare distributions (KS test, PSI).
2. Check for data leakage (features computed from future or target information).
3. Produce the final feature set with documentation.
4. Write the feature engineering report with decisions and rationale.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
