# Missing Value Handler

Assess the missingness mechanism (MCAR, MAR, MNAR) and apply the appropriate handling strategy.

## Inputs

- `raw-dataset`: the dataset with missing values
- `quality-flags`: variables with high missingness flagged

## Outputs

- `missingness-analysis`: Little's MCAR test, pattern analysis, and mechanism classification
- `imputed-dataset`: dataset after imputation or case deletion with documentation

## Process

1. Run Little's MCAR test and examine missingness patterns (monotone vs arbitrary)
2. Classify the mechanism as MCAR, MAR, or MNAR based on pattern analysis and domain knowledge
3. Select the handling strategy: listwise deletion (MCAR), multiple imputation (MAR), or sensitivity modeling (MNAR)
4. Apply the strategy and document the number of imputed values per variable

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
