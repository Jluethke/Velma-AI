# Current Load Profiler

Measure the current load on the system and its growth trajectory. Load is not just the average; it includes peaks, variability, and trend.

## Inputs

- `system-description`: The system being analyzed
- `throughput-unit`: The measurement unit

## Outputs

- `current-load`: Average and peak load over the measurement period
- `load-growth-rate`: How fast load is growing (percent per month or per quarter)

## Process

1. Measure current load using the same units as throughput. Average load tells you the steady state. Peak load tells you the worst case.
2. Calculate load as a percentage of max sustainable throughput. This is your utilization.
3. Measure the growth rate by comparing load in the current period to the prior period.
4. If load is growing, calculate when utilization will hit 80% (the queuing theory danger zone). That date is your planning horizon.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
