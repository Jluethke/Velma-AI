# Hunt Execution Runner

Execute the hunt queries across the environment and collect results.

## Inputs

- `hunt-plan`: Plan with data sources and analysis procedures
- `query-library`: Queries to execute against each data source

## Outputs

- `raw-hunt-results`: Query results from all data sources
- `execution-log`: Log of queries run, time ranges covered, and data volumes processed

## Process

1. Execute each query against the specified data sources and time ranges
2. Record the results with timestamps, affected systems, and users
3. Note any data gaps (missing log sources, retention issues) that limit the hunt

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
