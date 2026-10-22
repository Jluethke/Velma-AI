# Velocity Monitoring Setup

Set up the ongoing monitoring system: how to track whether the interventions are working and whether new high-velocity categories emerge.

## Inputs

- `intervention-plans`: The interventions being implemented
- `velocity-table`: The full velocity table for all categories

## Outputs

- `monitoring-dashboard-spec`: What to track monthly: velocity rates for all categories, intervention progress for the top 3, and an alert threshold for new high-velocity categories
- `expense-velocity-report`: The complete velocity analysis report with current state, projections, interventions, and monitoring plan

## Process

1. Define the monthly check: recalculate velocity rates for all categories. If any category not in the current top 3 exceeds a 10% annual growth rate for 2 consecutive months, flag it as an emerging high-velocity category.
2. For each active intervention, track the actual monthly amount versus the projected amount (with intervention) versus the do-nothing projection. If actual exceeds the intervention projection by more than 15%, the intervention is failing and needs revision.
3. Set a quarterly review: recalculate the full velocity ranking and update the top 3. Categories rotate as interventions succeed and new pressures emerge.
4. Produce the final report: the velocity table, the top 3 with their drivers, the projections, the interventions, the expected savings, and the monitoring schedule.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
