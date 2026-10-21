# Network Property Tester

Test whether the network has scale-free, small-world, or other structural properties: fit the degree distribution, compute clustering and path length.

## Inputs

- `network-graph`: The constructed graph
- `graph-summary`: Basic graph statistics

## Outputs

- `property-test-results`: Whether the network is scale-free, small-world, random, or other
- `degree-distribution-fit`: Best-fit distribution for the degree sequence (power law, exponential, etc.)

## Process

1. Fit the degree distribution to candidate models (power law, log-normal, exponential).
2. Compute the clustering coefficient and average shortest path length.
3. Compare clustering and path length to random graphs of the same size and density (small-world test).
4. Report which structural properties hold and which do not.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
