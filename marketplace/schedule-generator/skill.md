# Schedule Generator

Generate the production schedule using finite capacity logic.

## Inputs

- `constraint-set`: Scheduling constraints
- `material-availability`: Material status

## Outputs

- `draft-schedule`: Initial production schedule by work center
- `load-profile`: Capacity utilization by work center and period

## Process

1. Run the scheduling algorithm (forward or backward, finite capacity)
2. Load jobs to work centers respecting constraints
3. Resolve overloads by splitting, shifting, or outsourcing
4. Generate the Gantt chart and load profile

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
