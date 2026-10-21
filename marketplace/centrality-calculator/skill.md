# Centrality Calculator

Compute centrality measures for each node: degree, betweenness, closeness, eigenvector, and PageRank.

## Inputs

- `network-graph`: The constructed graph

## Outputs

- `centrality-table`: Each node with its centrality scores across all measures
- `top-nodes`: The highest-ranked nodes by each centrality measure

## Process

1. Compute degree centrality (raw count of connections).
2. Compute betweenness centrality (how often a node lies on shortest paths between others).
3. Compute eigenvector centrality or PageRank (importance weighted by neighbors' importance).
4. Rank nodes by each measure and identify the most central by each criterion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
