# Reduction Method Selector

Select the decomposition method (PCA, t-SNE, UMAP, factor analysis, MDS) based on data characteristics and analysis goals.

## Inputs

- `standardized-matrix`: preprocessed feature matrix
- `analysis-goal`: whether the goal is linear structure, cluster visualization, latent factors, or embedding

## Outputs

- `method-choice`: selected method with rationale
- `hyperparameters`: method-specific settings (n_components, perplexity, n_neighbors, etc.)

## Process

1. Assess linearity of the data (scree plot, correlation structure)
2. Match the analysis goal to method strengths: PCA for linear variance, t-SNE/UMAP for local structure, FA for latent constructs
3. Set hyperparameters: number of components (scree, parallel analysis), perplexity (t-SNE), n_neighbors (UMAP)
4. Document the rationale for the selection

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
