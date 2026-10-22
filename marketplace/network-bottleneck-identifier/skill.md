# Network Bottleneck Identifier

Identify current and projected bottlenecks in the network.

## Inputs

- `utilization-report`: Current utilization metrics
- `demand-forecast`: Projected demand by segment

## Outputs

- `bottleneck-list`: List of current and projected bottlenecks ranked by severity
- `risk-assessment`: Risk of service degradation per segment and timeline

## Process

1. Compare projected demand against rated capacity for each segment.
2. Flag segments that will exceed 80% utilization within the planning horizon.
3. Rank bottlenecks by severity (time to saturation, number of users affected).
4. Assess the service impact if each bottleneck is not addressed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
