# Capacity Addition Lead Time Estimator

Estimate how long it takes to add capacity. Hiring takes months. Server provisioning takes days. Building a factory takes years. If your planning horizon is shorter than your lead time, you are already late.

## Inputs

- `system-description`: The system being analyzed
- `current-load`: Current load and utilization
- `load-growth-rate`: How fast load is growing

## Outputs

- `capacity-options`: Ways to add capacity with the lead time, cost, and throughput gain of each
- `critical-date`: The date by which capacity must be ordered to arrive before utilization hits 80%

## Process

1. List every way to add capacity: hire staff (lead time: 2-4 months from posting to productive), add infrastructure (lead time: days to weeks), optimize the process (lead time: depends on complexity), outsource (lead time: weeks to months).
2. For each option, note the cost and the throughput gain.
3. Calculate the critical date: the date utilization hits 80%, minus the lead time of the chosen capacity addition. If this date is in the past, the system is already at risk.
4. If the critical date is in the past, identify the fastest capacity option and implement it immediately, then plan the longer-term solution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
