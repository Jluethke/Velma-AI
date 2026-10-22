# Harvest Equipment Scheduler

Schedule equipment and labor for the harvest period.

## Inputs

- `harvest-window`: Target harvest dates
- `acreage-plan`: Fields and acreage to harvest

## Outputs

- `equipment-schedule`: Combine, truck, and labor assignments by day
- `contingency-plan`: Backup plan for equipment breakdown or weather delays

## Process

1. Calculate daily harvest capacity based on equipment and field conditions.
2. Assign equipment and operators to fields in priority order.
3. Schedule trucking capacity to match harvest throughput.
4. Plan contingencies for breakdowns and rain delays.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
