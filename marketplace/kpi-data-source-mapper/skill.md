# Kpi Data Source Mapper

Identify and connect data sources for each KPI.

## Inputs

- `kpi-list`: Defined KPIs
- `current-metrics`: Existing data sources and systems

## Outputs

- `data-source-map`: Each KPI matched to its data source and extraction method
- `data-gap-list`: KPIs where data is not yet available

## Process

1. Match each KPI to its data source (database, API, spreadsheet, manual entry).
2. Define the extraction method and refresh schedule.
3. Identify KPIs with no available data source and plan how to close the gap.
4. Produce the data source map and gap list.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
