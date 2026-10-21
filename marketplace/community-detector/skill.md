# Community Detector

Detect communities or clusters in the network: groups of nodes more densely connected to each other than to the rest.

## Inputs

- `network-graph`: The constructed graph

## Outputs

- `community-assignments`: Each node's community membership
- `modularity-score`: How well the detected communities separate from each other

## Process

1. Select a community detection algorithm appropriate for the graph size and type (Louvain, Leiden, or label propagation).
2. Run the algorithm and obtain community assignments.
3. Compute the modularity score to assess partition quality.
4. Check robustness by running the algorithm multiple times or with different methods.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
