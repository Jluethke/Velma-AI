# Single Cell Trajectory Analysis

Infer developmental trajectories and cell state transitions from single-cell data. RNA velocity (scVelo) uses the ratio of spliced to unspliced mRNA to infer the direction of transcriptional change. Monocle3 orders cells along a learned trajectory graph (principal graph) and assigns pseudotime values representing progress along biological processes like differentiation.

## Inputs

- `clustered-adata`: Clustered and annotated AnnData object
- `spliced-unspliced-counts`: Separate spliced and unspliced count matrices from velocyto or STARsolo

## Outputs

- `trajectory-results`: Pseudotime ordering, branch points, RNA velocity vectors, and trajectory-associated genes
- `dynamic-genes`: Genes with significant expression changes along the trajectory, ordered by activation time

## Process

1. Generate spliced/unspliced count matrices: run velocyto (velocyto run with BAM and GTF) or STARsolo with --soloFeatures Gene Velocyto. Unspliced counts come from reads mapping to introns; spliced counts from exon-only reads. Typical unspliced fraction is 10-20% of total counts.
2. Run scVelo preprocessing: scv.pp.filter_and_normalize(adata, min_shared_counts=20). Compute first and second order moments: scv.pp.moments(adata, n_pcs=30, n_neighbors=30). Moments smooth the count data over the nearest-neighbor graph to reduce noise.
3. Fit velocity model: scv.tl.velocity(adata, mode='dynamical'). The dynamical model (preferred over steady-state) fits per-gene kinetic parameters (transcription rate alpha, splicing rate beta, degradation rate gamma) using an expectation-maximization algorithm. This captures genes in induction, repression, and steady-state phases.
4. Compute velocity graph: scv.tl.velocity_graph(adata). This projects RNA velocity vectors onto the cell-cell graph, estimating transition probabilities between cells. Visualize with scv.pl.velocity_embedding_stream(adata, basis='umap') to see directional flow overlaid on the UMAP.
5. For pseudotime ordering with Monocle3: learn the principal graph (learn_graph), set the root cell (order_cells with root specified at the known progenitor population), and extract pseudotime values. Monocle3 uses reversed graph embedding (SimplePPT or L1-graph) to fit a tree or graph structure to the data.
6. Identify trajectory-associated genes: fit gene expression as a function of pseudotime using generalized additive models (Monocle3 graph_test) or scVelo's rank_dynamical_genes. Cluster dynamic genes by their temporal activation pattern to identify gene modules activated at different trajectory stages (early, intermediate, late).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
