# Scrna Analysis Report

Compile the single-cell analysis into a report with QC, clustering, markers, cell types, and biological interpretation.

## Inputs

- `qc-metrics`: Quality control results
- `cluster-umap-plot`: Clustering visualization
- `cell-type-labels`: Annotated cell types
- `marker-heatmap`: Marker gene expression patterns

## Outputs

- `scrna-report`: Complete single-cell RNA-seq analysis report
- `processed-data-object`: Annotated AnnData or Seurat object for further analysis

## Process

1. Present QC filtering statistics and the effect on cell and gene counts.
2. Show the UMAP with cluster and cell type annotations.
3. Include the marker gene heatmap and a dot plot of top markers.
4. Discuss the cell type composition, any novel populations, and biological implications.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
