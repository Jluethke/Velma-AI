# Sem Parameter Estimator

Estimate model parameters using maximum likelihood, weighted least squares, or resistant variants appropriate to the data.

## Inputs

- `equation-system`: Structural and measurement equations
- `software-syntax`: Model syntax for the estimation software
- `dataset`: Covariance matrix or raw data with sample size

## Outputs

- `parameter-estimates`: Point estimates, standard errors, and p-values for all free parameters
- `estimation-diagnostics`: Convergence status, improper solutions, and Heywood cases

## Process

1. Select the estimator based on data properties (ML for continuous normal, WLSMV for categorical, MLR for non-normal).
2. Run the estimation and check for convergence.
3. Flag any negative variances, correlations above 1.0, or non-positive-definite matrices.
4. Record standardized and unstandardized solutions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
