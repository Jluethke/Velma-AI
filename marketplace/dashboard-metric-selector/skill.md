# Dashboard Metric Selector

Select the KPIs and metrics to display on the dashboard.

## Inputs

- `audience-profile`: Who the users are and their decisions
- `information-needs`: What questions the dashboard must answer

## Outputs

- `selected-metrics`: List of metrics with definitions, data sources, and update frequency
- `metric-hierarchy`: How the metrics relate to each other (primary, secondary, supporting)

## Process

1. For each information need, identify the metric that answers it.
2. Define each metric: name, formula, data source, update frequency.
3. Rank metrics into primary (top of dashboard), secondary, and supporting.
4. Verify that every audience decision maps to at least one metric.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
