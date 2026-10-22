# Capacity Inventory Assessor

Assess available production capacity and materials.

## Inputs

- `demand-plan`: Demand by product and period
- `resource-data`: Machine, labor, and material availability

## Outputs

- `capacity-profile`: Available capacity by work center and period
- `material-availability`: Material status and shortage list

## Process

1. Calculate available capacity per work center (shifts, efficiency, planned downtime)
2. Check material availability against the bill of materials
3. Identify bottleneck work centers
4. Flag material shortages that will constrain the schedule

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
