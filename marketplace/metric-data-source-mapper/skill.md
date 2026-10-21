# Metric Data Source Mapper

Map each metric to its data source and define the collection pipeline.

## Inputs

- `metric-definitions`: Metrics with formulas and data sources
- `metric-priority-list`: Prioritized metrics for implementation

## Outputs

- `data-pipeline-design`: Collection pipeline for each metric including source, extraction, and storage
- `data-gap-list`: Metrics that cannot be collected with current tooling

## Process

1. For each metric, identify the exact API, log query, or database table that provides the raw data
2. Design the extraction and transformation logic for each data source
3. Identify metrics that require data not currently collected and note the gap

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
