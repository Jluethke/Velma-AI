# Pipeline Data Collector

Collect pipeline data by stage, value, and expected close date.

## Inputs

- `crm-export`: Current pipeline export from the CRM
- `forecast-period`: Time period to forecast

## Outputs

- `pipeline-snapshot`: Cleaned pipeline data for the forecast period
- `data-quality-flags`: Missing or suspect data points

## Process

1. Filter the pipeline to the forecast period.
2. Flag deals with missing close dates or stale stages.
3. Normalize deal values to a common currency if needed.
4. Produce the cleaned snapshot.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
