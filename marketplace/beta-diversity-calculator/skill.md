# Beta Diversity Calculator

Compute between-site dissimilarity using Bray-Curtis, Jaccard, and other distance metrics.

## Inputs

- `abundance-matrix`: Site-by-species abundance matrix
- `distance-metric`: Metric selection: Bray-Curtis (abundance) or Jaccard (presence-absence)

## Outputs

- `distance-matrix`: Pairwise site dissimilarity matrix
- `ordination-coordinates`: NMDS or PCoA coordinates for visualization

## Process

1. Compute the pairwise distance matrix using the selected metric
2. Run non-metric multidimensional scaling (NMDS) or PCoA for ordination
3. Report stress (NMDS) or proportion of variance explained (PCoA)
4. Generate the ordination plot with sites colored by group

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
