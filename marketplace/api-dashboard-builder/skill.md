# Api Dashboard Builder

Build the API monitoring dashboard.

## Inputs

- `health-metrics`: What to measure
- `metric-thresholds`: Normal, warning, critical levels

## Outputs

- `monitoring-dashboard`: Dashboard showing real-time API health across all metrics
- `dashboard-layout`: How the dashboard is organized for incident response

## Process

1. Design the dashboard layout: overview panel (status, key numbers), detailed panels by metric category.
2. Add time-range selectors for investigating incidents.
3. Add endpoint-level drill-down for isolating problems.
4. Include a dependency health panel.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
