# Pca Model Building

Build a PCA or PLS model from the reference process data to capture the normal correlation structure.

## Inputs

- `process-matrix`: Scaled process variable matrix for the reference period
- `model-selection-criteria`: Cross-validation method and number of components to evaluate

## Outputs

- `pca-model`: Fitted PCA or PLS model with loadings, scores, and retained components
- `model-diagnostics`: Explained variance, cross-validation results, and component selection rationale

## Process

1. Compute the PCA decomposition of the scaled process matrix
2. Select the number of retained components using cross-validation or scree plot
3. Examine loading plots to verify that the components capture meaningful process relationships
4. Compute model statistics (explained variance per component, Q residuals on the training set)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
