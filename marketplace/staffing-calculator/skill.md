# Staffing Calculator

Calculate staffing requirements per shift from the volume forecast.

## Inputs

- `volume-forecast`: Expected ticket volumes
- `agent-capacity`: Average tickets per agent per hour by channel

## Outputs

- `staffing-requirements`: Required agents per shift
- `coverage-gaps`: Shifts where current headcount is insufficient

## Process

1. Calculate required agents per hour using the volume forecast and agent capacity.
2. Account for shrinkage (breaks, meetings, training, PTO).
3. Identify coverage gaps where demand exceeds supply.
4. Recommend hiring or schedule adjustments for gaps.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
