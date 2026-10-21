# Convergence Divergence Mapper

Identify which findings converge (agree across sources) and which diverge, grouping evidence by conclusion.

## Inputs

- `weighted-evidence-table`: sources with quality weights and findings

## Outputs

- `convergence-map`: clusters of sources supporting each conclusion, with aggregate weight
- `divergence-catalog`: pairs or groups of sources reaching opposing conclusions, with possible explanations

## Process

1. Extract the key finding or conclusion from each source
2. Group sources by their conclusion (supporting, opposing, neutral, or irrelevant)
3. Compute the aggregate quality weight for each conclusion cluster
4. Identify divergent pairs and hypothesize why they disagree (population, method, definition, measurement, timeframe)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
