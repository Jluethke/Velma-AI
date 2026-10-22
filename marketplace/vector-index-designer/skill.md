# Vector Index Designer

Design the index configuration for the selected platform.

## Inputs

- `platform-selection`: Selected database
- `data-profile`: Data characteristics

## Outputs

- `index-config`: Index parameters (dimensions, metric, HNSW settings)
- `schema-design`: Collection schema with metadata fields

## Process

1. Set the vector dimensions and distance metric.
2. Configure the index algorithm parameters (HNSW M, efConstruction).
3. Design the metadata schema for filtering.
4. Set the replication and sharding configuration.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
