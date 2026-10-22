# Bottleneck Identifier

Identify infrastructure bottlenecks and headroom by comparing current utilization against capacity limits.

## Inputs

- `utilization-data`: Current utilization metrics
- `resource-catalog`: Catalog of resources with specifications

## Outputs

- `bottleneck-report`: List of resources approaching capacity limits
- `headroom-analysis`: Remaining headroom for each resource category

## Process

1. Compare current utilization against capacity limits for each resource
2. Flag resources above 70% utilization as approaching limits
3. Rank bottlenecks by business impact if they are hit
4. Calculate headroom as the difference between current usage and limit

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
