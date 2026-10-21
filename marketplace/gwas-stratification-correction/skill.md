# Gwas Stratification Correction

Compute principal components from the genotype data to correct for population stratification.

## Inputs

- `qc-passed-dataset`: QC-filtered genotype data

## Outputs

- `principal-components`: Top principal components (typically 10-20) per sample
- `population-structure-plot`: PC1 vs PC2 scatter plot colored by self-reported ancestry

## Process

1. Prune variants for linkage disequilibrium to get an independent set.
2. Compute the genomic relationship matrix and extract principal components.
3. Plot PC1 vs PC2 and compare with known reference populations.
4. Select the number of PCs to include as covariates (scree plot or Tracy-Widom test).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
