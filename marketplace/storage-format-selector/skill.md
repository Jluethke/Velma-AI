# Storage Format Selector

Select the storage format and table format for the lakehouse.

## Inputs

- `layer-design`: Layer architecture design
- `query-patterns`: Expected query patterns and performance needs

## Outputs

- `format-selection`: Selected file and table formats per layer
- `partitioning-strategy`: Partitioning and clustering strategy per table

## Process

1. Evaluate file formats (Parquet, ORC, Avro) against query patterns.
2. Select the table format (Delta Lake, Apache Iceberg, Apache Hudi).
3. Design the partitioning strategy per table based on query filters.
4. Plan compaction and optimization schedules.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
