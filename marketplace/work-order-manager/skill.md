# Work Order Manager

Schedule and track maintenance work orders.

## Inputs

- `annual-schedule`: PM schedule
- `task-library`: Task definitions

## Outputs

- `active-work-orders`: Current open work orders with status
- `completion-metrics`: PM completion rate and overdue count

## Process

1. Generate work orders from the annual schedule.
2. Assign work orders to technicians by skill.
3. Track completion and close work orders.
4. Report PM completion rate weekly.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
