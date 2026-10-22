# Single Cell Clustering Annotation

Reduce dimensions, cluster cells, and annotate cell types. PCA on highly variable genes followed by UMAP for visualization. Leiden or Louvain community detection on the shared nearest neighbor (SNN) graph identifies cell populations. Cell types are assigned by marker gene expression, reference-based mapping (SingleR, CellTypist), or manual annotation from known markers.

## Inputs

- `filtered-adata`: Normalized and HVG-selected AnnData with QC filtering applied
- `reference-atlas`: Reference single-cell atlas for automated cell type annotation (optional)

## Outputs

- `clustered-adata`: AnnData with cluster assignments, UMAP coordinates, and cell type labels
- `marker-genes`: Top differentially expressed genes per cluster with fold change, p-value, and specificity metrics

## Process

1. Run PCA on the HVG expression matrix: sc.tl.pca(adata, n_comps=50). Determine the effective dimensionality from the elbow plot of variance explained per component. Typically 15-30 PCs capture the biologically meaningful variation; including too many PCs adds noise.
2. Build nearest-neighbor graph from PCA space: sc.pp.neighbors(adata, n_neighbors=15, n_pcs=30). The number of neighbors (k) controls granularity: smaller k produces more clusters. The graph uses approximate nearest neighbors (annoy or pynndescent) for speed.
3. Cluster with Leiden algorithm: sc.tl.leiden(adata, resolution=0.5). Resolution parameter controls cluster granularity: 0.2-0.5 yields broad cell types, 0.5-1.0 yields subtypes, >1.0 yields fine-grained populations. Start with 0.5 and adjust based on biological expectations. Leiden is preferred over Louvain because it guarantees connected communities.
4. Compute UMAP embedding: sc.tl.umap(adata, min_dist=0.3, spread=1.0). UMAP is for visualization only, not for clustering (clusters are defined on the graph, not the UMAP). Do not over-interpret distances in UMAP space; only local neighborhood structure is preserved reliably.
5. Find marker genes per cluster: sc.tl.rank_genes_groups(adata, groupby='leiden', method='wilcoxon'). For each cluster, report the top genes by fold change with adjusted p-value < 0.05. Also calculate percentage of cells expressing each gene within vs outside the cluster (pct.1 vs pct.2 in Seurat) for specificity assessment.
6. Annotate cell types: match marker gene profiles to known cell type signatures (e.g., CD3D/CD3E for T cells, MS4A1/CD19 for B cells, LYZ/CD14 for monocytes, EPCAM for epithelial). For automated annotation, run SingleR against a reference atlas (Human Cell Atlas, Tabula Sapiens): SingleR calculates Spearman correlation between each cell's expression profile and reference cell type centroids, then assigns the best-matching type with a quality score.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
