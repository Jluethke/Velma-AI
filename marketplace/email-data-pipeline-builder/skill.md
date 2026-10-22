# Email Data Pipeline Builder

Build the data pipeline from the ESP to the analytics layer.

## Inputs

- `kpi-definitions`: The KPIs to calculate
- `reporting-dimensions`: The dimensions to support

## Outputs

- `data-pipeline`: The data pipeline configuration (source APIs, transformations, storage, refresh schedule)
- `data-model`: The data model for the analytics layer (tables, relationships, calculated fields)

## Process

1. Configure the data extract from the ESP API (send events, open events, click events, bounce events, unsubscribe events).
2. Transform the raw events into the metrics defined in the KPIs.
3. Build the data model with fact and dimension tables.
4. Set the refresh schedule and monitor for data freshness.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
