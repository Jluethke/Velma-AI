# Scrna Clustering

Cluster cells into transcriptionally distinct groups using graph-based community detection.

## Inputs

- `pca-embeddings`: PCA coordinates for neighbor graph construction
- `umap-coordinates`: 2D coordinates for visualization of clusters

## Outputs

- `cluster-assignments`: Cluster label for each cell
- `cluster-umap-plot`: UMAP colored by cluster identity

## Process

1. Construct a shared nearest-neighbor (SNN) graph from the PCA embeddings.
2. Run Leiden or Louvain community detection at one or more resolution parameters.
3. Visualize clusters on the UMAP and inspect for over- or under-clustering.
4. Adjust resolution and re-cluster if needed until clusters correspond to visually separable groups.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
