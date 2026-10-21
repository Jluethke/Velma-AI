# Scrna Dimension Reduction

Reduce the high-dimensional expression data to a low-dimensional representation using PCA followed by UMAP or t-SNE.

## Inputs

- `normalized-matrix`: Log-normalized expression values
- `highly-variable-genes`: Gene subset for PCA

## Outputs

- `pca-embeddings`: Top principal components (typically 30-50)
- `umap-coordinates`: 2D UMAP embedding for visualization

## Process

1. Run PCA on the highly variable genes and select the number of components using an elbow plot.
2. Compute a k-nearest-neighbor graph from the PCA embeddings.
3. Run UMAP on the neighbor graph to produce a 2D visualization.
4. Color the UMAP by QC metrics to verify that structure is biological, not technical.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
