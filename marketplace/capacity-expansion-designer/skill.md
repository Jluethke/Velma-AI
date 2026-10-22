# Capacity Expansion Designer

Design the capacity expansion plan to address identified bottlenecks.

## Inputs

- `bottleneck-list`: Ranked list of bottlenecks
- `demand-forecast`: Projected demand

## Outputs

- `expansion-plan`: Planned upgrades by segment (hardware, links, peering, CDN)
- `implementation-timeline`: Phased timeline for each upgrade

## Process

1. For each bottleneck, identify the upgrade options (bandwidth increase, hardware upgrade, new links, peering agreements).
2. Select the option that best balances cost, lead time, and headroom.
3. Phase the upgrades by priority and dependency.
4. Document the implementation timeline with milestones.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
