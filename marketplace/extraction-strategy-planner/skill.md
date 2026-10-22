# Extraction Strategy Planner

Design the extraction strategy for each source system.

## Inputs

- `source-catalog`: Catalog of source systems
- `schema-mapping`: Source-to-target field mapping

## Outputs

- `extraction-plan`: Extraction strategy per source (full, incremental, CDC)
- `extraction-schedule`: Timing and frequency for each extraction

## Process

1. Select full load vs incremental vs change data capture for each source.
2. Define the change detection mechanism (timestamp, sequence, log-based).
3. Set extraction windows to minimize source system impact.
4. Plan error handling and retry logic for each extraction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
