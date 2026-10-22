# Utilization Data Collector

Collect utilization data for compute, storage, and network.

## Inputs

- `infrastructure-scope`: Which infrastructure to monitor (servers, storage, network, cloud)
- `monitoring-tools`: Available monitoring tools and data sources

## Outputs

- `utilization-data`: Current utilization metrics for all infrastructure components
- `utilization-baselines`: Baseline utilization levels for normal and peak periods

## Process

1. Connect to monitoring tools and collect CPU, memory, disk, and network metrics.
2. Establish baseline utilization for normal business hours and peak periods.
3. Identify components that are consistently above 80% utilization.
4. Flag components with no monitoring coverage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
