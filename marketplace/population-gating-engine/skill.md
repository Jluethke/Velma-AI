# Population Gating Engine

Gate cell populations using sequential bivariate plots or automated clustering.

## Inputs

- `compensated-events`: Compensated event-level data
- `panel-definition`: Marker assignments for gating hierarchy

## Outputs

- `gated-populations`: Named cell populations with parent-child hierarchy
- `gating-report`: Gating tree diagram and gate coordinates for reproducibility

## Process

1. Apply a scatter gate to exclude debris, doublets, and dead cells
2. Gate sequentially on lineage markers following the defined hierarchy
3. For automated gating, run FlowSOM or similar clustering and map clusters to populations
4. Export the gating tree with coordinates for each gate

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
