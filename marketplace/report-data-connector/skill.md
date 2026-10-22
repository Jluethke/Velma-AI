# Report Data Connector

Connect the report template to its data sources and define the queries.

## Inputs

- `report-outline`: Sections, metrics, and visual types
- `data-requirements`: Fields and aggregations needed

## Outputs

- `data-connections`: Configured connections and queries for each data source
- `calculation-definitions`: Formulas and aggregations applied to raw data to produce the report metrics

## Process

1. For each data source, set up the connection (credentials, endpoint, query).
2. Write the query or extraction logic for each metric.
3. Define the calculated fields and aggregations (ratios, running totals, year-over-year).
4. Test each connection and query with sample data.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
