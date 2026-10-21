# Network Visualizer

Produce a publication-quality network visualization: layout, coloring by community, sizing by centrality, and labeling key nodes.

## Inputs

- `network-graph`: The graph
- `community-assignments`: Community coloring
- `centrality-table`: Node sizes

## Outputs

- `network-figure`: The rendered network visualization
- `figure-caption`: Caption describing the layout, coloring, and sizing conventions

## Process

1. Choose a layout algorithm (force-directed for general, circular for communities, hierarchical for DAGs).
2. Map community membership to node color and centrality to node size.
3. Label the top nodes by centrality and all bridge nodes.
4. Export as vector format and write the figure caption.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
