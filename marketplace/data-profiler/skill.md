# Data Profiler

Profile the data to establish quality baselines.

## Inputs

- `datasets`: Datasets to profile
- `quality-objectives`: What quality dimensions matter most

## Outputs

- `baseline-profile`: Statistical baselines for each column and table
- `anomaly-history`: Historical anomalies found during profiling

## Process

1. Compute column-level statistics (nulls, cardinality, min, max, distribution).
2. Compute table-level statistics (row counts, freshness, schema changes).
3. Identify historical patterns and seasonal variations.
4. Establish baseline thresholds for each quality dimension.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
