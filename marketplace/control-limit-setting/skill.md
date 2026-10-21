# Control Limit Setting

Set T-squared and Q-residual control limits from the reference data using the appropriate statistical distributions.

## Inputs

- `pca-model`: Fitted PCA model from the reference period
- `confidence-level`: Desired confidence level for the control limits (typically 95% or 99%)

## Outputs

- `control-limits`: T-squared and Q-residual control limits at the specified confidence level
- `reference-control-charts`: Control charts of T-squared and Q for the reference data, confirming the limits capture normal variation

## Process

1. Compute the T-squared limit from the F-distribution for the number of components and observations
2. Compute the Q-residual limit from the Jackson-Mudholkar approximation or bootstrap
3. Plot the reference-period T-squared and Q values against the limits to verify coverage
4. Adjust if the reference data show non-normality that the limits do not accommodate

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
