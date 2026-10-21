# Scrna Normalization

Normalize single-cell counts to correct for differences in sequencing depth across cells.

## Inputs

- `filtered-matrix`: QC-filtered count matrix
- `qc-metrics`: Cell-level QC data for informed normalization

## Outputs

- `normalized-matrix`: Log-normalized expression matrix
- `highly-variable-genes`: List of genes with high cell-to-cell variability for downstream analysis

## Process

1. Normalize each cell's counts by its total UMI count and scale to a target sum (e.g., 10,000).
2. Log-transform the normalized counts (log1p).
3. Identify highly variable genes using variance-to-mean ratio or similar method.
4. Select the top 2000-3000 highly variable genes for dimensionality reduction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
