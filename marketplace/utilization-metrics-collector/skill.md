# Utilization Metrics Collector

Collect current infrastructure utilization metrics across compute, storage, network, and database resources.

## Inputs

- `infrastructure-inventory`: List of infrastructure resources to measure
- `monitoring-access`: Access to monitoring systems and dashboards

## Outputs

- `utilization-data`: Current utilization metrics for all resources
- `resource-catalog`: Catalog of resources with their specifications

## Process

1. Query monitoring systems for CPU, memory, disk, and network utilization
2. Collect database connection counts, query throughput, and storage growth
3. Record peak and average utilization over the measurement period
4. Catalog each resource with its current specifications and limits

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
