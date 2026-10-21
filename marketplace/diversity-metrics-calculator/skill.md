# Diversity Metrics Calculator

Compute alpha and beta diversity metrics from the taxonomy table.

## Inputs

- `taxonomy-table`: OTU or ASV table with counts per sample
- `sample-metadata`: Metadata for each sample (group, site, timepoint)

## Outputs

- `alpha-diversity`: Per-sample richness (observed, Chao1) and evenness (Shannon, Simpson)
- `beta-diversity-matrix`: Pairwise distance matrix (Bray-Curtis, UniFrac) with ordination coordinates

## Process

1. Rarefy or normalize the count table to even depth
2. Compute alpha diversity indices for each sample
3. Compute beta diversity distances between all sample pairs
4. Run ordination (PCoA or NMDS) and test group separation (PERMANOVA)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
