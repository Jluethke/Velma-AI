# Biological Network Construction

Build protein-protein interaction or gene co-expression networks from the enriched gene sets and identify functional modules.

## Inputs

- `enrichment-results`: Enriched gene sets for network seeding
- `call-results`: Full expression or variant data for edge weighting

## Outputs

- `network-graph`: Node and edge table for the constructed network with module assignments
- `hub-genes`: Top hub and bottleneck genes ranked by centrality measures

## Process

1. Query STRING or BioGRID for known interactions among the enriched gene set
2. Add co-expression edges from WGCNA or correlation analysis if expression data is available
3. Detect functional modules using Louvain or MCL clustering
4. Rank nodes by degree, betweenness, and closeness centrality to identify hub genes

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
