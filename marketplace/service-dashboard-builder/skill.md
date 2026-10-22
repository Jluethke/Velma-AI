# Service Dashboard Builder

Build dashboards for key services showing latency, error rates, throughput, and resource utilization.

## Inputs

- `instrumentation-status`: Services that are instrumented
- `observability-requirements`: What needs to be visualized

## Outputs

- `service-dashboards`: Dashboards for each key service
- `overview-dashboard`: Top-level system health dashboard

## Process

1. Build per-service dashboards with RED metrics
2. Build the infrastructure dashboard (CPU, memory, disk, network)
3. Build the top-level overview showing system health at a glance
4. Add links between dashboards for drill-down investigation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
