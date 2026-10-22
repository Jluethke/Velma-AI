# Dashboard Census

Take a census of every metric on every dashboard in scope. Count them. The number is usually higher than anyone expects, because dashboards accumulate metrics over time and nobody removes old ones.

## Inputs

- `dashboard-list`: The dashboards to audit (URLs, screenshots, or names)
- `audience-description`: Who looks at these dashboards and what decisions they make

## Outputs

- `metric-census`: Every metric on every dashboard: name, visualization type, update frequency, and which dashboard it appears on
- `total-metric-count`: The total number of metrics across all dashboards

## Process

1. Walk through each dashboard and list every metric, chart, number, gauge, and table. Count each distinct data point as one metric. A chart with 5 series counts as 5 metrics.
2. Record the visualization type (line chart, bar chart, number, gauge, table, pie chart) and the update frequency (real-time, daily, weekly, monthly) for each.
3. Sum the total. If it exceeds 20 metrics per decision-maker, the dashboards are almost certainly carrying dead weight.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
