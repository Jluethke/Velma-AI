# Industrial Dashboard Builder

Build real-time dashboards for the industrial monitoring data.

## Inputs

- `collection-config`: Data collection configuration
- `criticality-ranking`: Equipment priority ranking

## Outputs

- `dashboard-layout`: The dashboard with panels for each equipment and metric
- `alert-rules`: Alert thresholds and escalation rules for each metric

## Process

1. Design the dashboard with an overview panel and drill-down panels per equipment.
2. Set the alert thresholds based on normal operating ranges and manufacturer specs.
3. Configure the escalation path (operator, supervisor, maintenance, management).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
