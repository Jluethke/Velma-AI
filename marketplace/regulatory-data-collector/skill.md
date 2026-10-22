# Regulatory Data Collector

Collect and aggregate data from source systems for reporting.

## Inputs

- `required-reports`: Reports to produce
- `data-requirements`: Fields and sources needed

## Outputs

- `collected-data`: Aggregated data sets for each report
- `data-quality-flags`: Items failing validation or requiring manual review

## Process

1. Extract data from the core system, general ledger, and ancillary systems.
2. Aggregate and transform to match the reporting schema.
3. Run validation checks and flag items that fail.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
