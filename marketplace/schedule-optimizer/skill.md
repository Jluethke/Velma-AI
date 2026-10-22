# Schedule Optimizer

Optimize the schedule for on-time delivery and utilization.

## Inputs

- `draft-schedule`: Initial schedule
- `priority-rules`: Order priority criteria

## Outputs

- `optimized-schedule`: Final production schedule
- `schedule-kpis`: On-time rate, utilization, changeover count, WIP level

## Process

1. Evaluate the draft against KPIs (on-time delivery, utilization, WIP)
2. Apply heuristics to reduce changeovers (batch similar products)
3. Balance load across parallel work centers
4. Verify all due dates are met or flag exceptions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
