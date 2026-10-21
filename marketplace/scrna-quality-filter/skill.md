# Scrna Quality Filter

Filter cells and genes from a single-cell RNA-seq count matrix based on quality metrics.

## Inputs

- `count-matrix`: Raw gene-by-cell count matrix from Cell Ranger or similar
- `sample-metadata`: Sample identifiers, batch labels, and expected cell counts

## Outputs

- `filtered-matrix`: Count matrix with low-quality cells and uninformative genes removed
- `qc-metrics`: Distribution plots of genes per cell, UMIs per cell, and mitochondrial fraction

## Process

1. Compute per-cell QC metrics: number of detected genes, total UMI count, percent mitochondrial reads.
2. Set thresholds to remove empty droplets (low UMI), doublets (high UMI and gene count), and dying cells (high mito).
3. Remove genes detected in fewer than a minimum number of cells.
4. Report how many cells and genes remain after filtering.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
