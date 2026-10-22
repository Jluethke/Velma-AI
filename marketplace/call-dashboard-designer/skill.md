# Call Dashboard Designer

Design the dashboard layout and visualizations.

## Inputs

- `metric-hierarchy`: Metrics organized by category
- `data-model`: The data model

## Outputs

- `dashboard-design`: Dashboard layout with visualization types, filters, and drill-down paths
- `alert-configuration`: Alert rules for metrics that breach thresholds

## Process

1. Design the executive summary view (top-level KPIs with trend arrows).
2. Design the real-time operations view (current queue depth, wait times, agent status).
3. Design the historical analysis views (trends by day, week, month; comparisons across periods).
4. Design the agent performance view (individual scorecards).
5. Configure the alerts for threshold breaches (abandon rate above 5%, ASA above 60 seconds).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
