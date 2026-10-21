# Dashboard Visualization Creator

Create the dashboard visualizations for each metric with appropriate chart types.

## Inputs

- `collection-pipeline`: Operational metric collection pipeline
- `pipeline-test-results`: Validated metric data

## Outputs

- `dashboard-layout`: Dashboard with visualizations for each metric
- `drill-down-views`: Detailed views for investigating metric anomalies

## Process

1. Select the appropriate chart type for each metric (time series, gauge, bar, table)
2. Arrange the dashboard with the highest priority metrics in the primary view
3. Create drill-down views for each metric that allow investigation of anomalies
4. Apply consistent color coding for status (red, yellow, green thresholds)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
