# Metric Selection For Alerting

Select the business metrics to monitor with threshold alerts.

## Inputs

- `business-kpis`: List of business KPIs and operational metrics
- `historical-metric-data`: Historical data for the candidate metrics (last 30 to 90 days)

## Outputs

- `selected-metrics`: Metrics selected for threshold alerting with rationale
- `baseline-values`: Baseline values (mean, standard deviation, percentiles) for each selected metric

## Process

1. Review the business KPIs and select those where a deviation requires immediate human attention.
2. For each selected metric, pull 30 to 90 days of historical data.
3. Calculate the baseline: mean, standard deviation, p5, p50, p95.
4. Exclude metrics that are too noisy or too stable for threshold alerting.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
