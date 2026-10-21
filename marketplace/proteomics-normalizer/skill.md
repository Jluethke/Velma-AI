# Proteomics Normalizer

Normalize protein abundances across samples to correct for systematic technical variation.

## Inputs

- `protein-groups`: Quantified protein groups per sample
- `experimental-design`: Sample groups, batches, and biological replicates

## Outputs

- `normalized-abundances`: Protein abundance matrix after normalization
- `normalization-report`: Before and after distributions, method used, and batch effects assessed

## Process

1. Log-transform intensity values.
2. Select normalization method (median centering, quantile, or variance stabilization).
3. Apply normalization and check for residual batch effects using PCA or clustering.
4. Impute remaining missing values using appropriate strategy (MinProb, KNN, or left-censored).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
