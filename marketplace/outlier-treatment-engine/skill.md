# Outlier Treatment Engine

Identify and treat outliers using statistical and domain-informed criteria.

## Inputs

- `imputed-dataset`: dataset after missing value handling
- `codebook`: valid ranges and domain constraints

## Outputs

- `outlier-catalog`: flagged observations with the detection method and proposed action
- `treated-dataset`: dataset after outlier treatment (winsorize, transform, exclude, or retain with flag)

## Process

1. Apply univariate detection (z-score >3, IQR x1.5, Grubbs test) per variable
2. Apply multivariate detection (Mahalanobis distance, Cook's distance) for influential observations
3. Cross-check statistical outliers against domain constraints to distinguish errors from genuine extremes
4. Treat each outlier: correct if data error, winsorize, transform, exclude, or retain with a sensitivity flag

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
