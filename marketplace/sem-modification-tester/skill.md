# Sem Modification Tester

Examine modification indices to identify potential model improvements, applied only where theoretically justified.

## Inputs

- `fit-indices`: Current model fit indices
- `parameter-estimates`: Current parameter estimates

## Outputs

- `modification-indices`: Ranked list of freed parameters with expected chi-square drop
- `respecification-candidates`: Theoretically defensible modifications with expected fit improvement

## Process

1. Extract modification indices for all fixed parameters.
2. Rank by expected parameter change and chi-square improvement.
3. Filter to retain only those with theoretical justification.
4. Document the rationale for each candidate modification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
