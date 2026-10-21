# Neighbor Series Assembler

Assemble a set of neighboring climate station records to use as references for detecting inhomogeneities in the target station.

## Inputs

- `target-station-data`: The climate record to homogenize with metadata (location, elevation, instrument history)
- `station-network`: Inventory of nearby stations with their records and metadata

## Outputs

- `reference-series`: Selected neighbor stations' records, quality-checked and complete enough for comparison
- `reference-composite`: A composite reference series from the weighted average of neighbors

## Process

1. Select neighboring stations within a correlation radius (typically 50-200 km for temperature).
2. Screen each neighbor for completeness and data quality.
3. Compute distance and correlation-based weights for each neighbor.
4. Build the composite reference as the weighted average of neighbor anomalies.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
