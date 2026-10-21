# Scrna Marker Identification

Identify marker genes that distinguish each cluster from all other clusters.

## Inputs

- `normalized-matrix`: Expression data for statistical testing
- `cluster-assignments`: Which cells belong to which cluster

## Outputs

- `marker-gene-table`: Top marker genes per cluster with log fold change, p-value, and percent expressed
- `marker-heatmap`: Heatmap of top markers across clusters

## Process

1. For each cluster, run a differential expression test (Wilcoxon rank-sum or logistic regression) against all other cells.
2. Filter markers by minimum log fold change and adjusted p-value threshold.
3. Rank markers by a combined score of effect size and specificity.
4. Generate a heatmap showing the top 5-10 markers per cluster across all cells.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
