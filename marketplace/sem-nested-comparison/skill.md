# Sem Nested Comparison

Compare the specified model against nested alternatives to test whether added complexity is warranted.

## Inputs

- `respecification-candidates`: Candidate model modifications
- `fit-indices`: Fit indices from the original model

## Outputs

- `model-comparison-table`: Chi-square difference tests, AIC, BIC for each nested pair
- `best-model`: The selected model with justification

## Process

1. Estimate each candidate respecified model.
2. Compute chi-square difference tests (Satorra-Bentler scaled if using resistant estimator).
3. Compare AIC and BIC across all candidates and the original.
4. Select the model that balances fit improvement against parsimony.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
