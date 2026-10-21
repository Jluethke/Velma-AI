# Decomposition Executor

Run the selected decomposition and produce the reduced representation.

## Inputs

- `standardized-matrix`: preprocessed feature matrix
- `method-choice`: selected method
- `hyperparameters`: method-specific parameter settings

## Outputs

- `reduced-representation`: observations in the lower-dimensional space
- `loading-matrix`: feature weights or loadings per component (where applicable)
- `variance-explained`: proportion of variance captured per component (for PCA/FA)

## Process

1. Fit the model on the standardized data with the specified hyperparameters
2. Extract the reduced coordinates for each observation
3. For linear methods, extract the loading matrix and variance explained per component
4. For nonlinear methods, record the embedding stress or trustworthiness metric

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
