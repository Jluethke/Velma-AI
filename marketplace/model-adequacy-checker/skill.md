# Model Adequacy Checker

Check whether the fitted model is adequate: residual analysis, lack-of-fit test, and comparison of candidate models.

## Inputs

- `fit-results`: Fitted models with residuals
- `organized-data`: Original data

## Outputs

- `adequacy-report`: Residual plots, lack-of-fit test result, model comparison (AIC/BIC)
- `selected-model`: The best model and why it was chosen

## Process

1. Plot residuals vs. fitted values and vs. concentration to check for patterns.
2. Run a lack-of-fit test (compare pure error to model residuals using replicate data).
3. Compare candidate models using AIC or likelihood ratio test if nested.
4. Select the simplest model that passes the lack-of-fit test.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
