# Lakehouse Layer Designer

Design the storage layers (bronze, silver, gold) and their purposes.

## Inputs

- `data-sources`: All data sources to ingest
- `use-cases`: Analytics and ML use cases to support

## Outputs

- `layer-design`: Design for bronze, silver, and gold layers
- `data-flow-diagram`: How data moves between layers

## Process

1. Define the bronze layer: raw ingestion, append-only, schema-on-read.
2. Define the silver layer: cleaned, conformed, deduplicated, schema-on-write.
3. Define the gold layer: business-level aggregates and feature stores.
4. Map each use case to the layer it reads from.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
