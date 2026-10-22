# Network Utilization Collector

Collect current network utilization data across all segments.

## Inputs

- `network-topology`: Map of network segments, links, and nodes
- `monitoring-sources`: List of monitoring systems and data feeds

## Outputs

- `utilization-report`: Current utilization metrics by segment (bandwidth, throughput, latency, packet loss)
- `peak-usage-patterns`: Peak usage times and volumes by segment

## Process

1. Inventory all network segments and their rated capacities.
2. Pull utilization data from monitoring systems for the reporting period.
3. Calculate average and peak utilization percentages by segment.
4. Identify segments approaching threshold (above 70% sustained utilization).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
