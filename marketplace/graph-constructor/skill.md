# Graph Constructor

Build the network graph from raw data: define nodes, edges, weights, and directionality.

## Inputs

- `relationship-data`: Raw data describing connections (e.g., citation pairs, interaction scores)
- `network-type`: What the nodes and edges represent

## Outputs

- `network-graph`: The constructed graph with node and edge attributes
- `graph-summary`: Node count, edge count, density, and whether directed or undirected

## Process

1. Parse the relationship data into a node list and an edge list.
2. Assign weights to edges if the data includes interaction strength or frequency.
3. Determine directionality: citations are directed, co-authorship is undirected.
4. Compute basic graph statistics: N, E, density, average degree.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
