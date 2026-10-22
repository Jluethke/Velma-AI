# Shift Type Definition

Define the shift types and coverage requirements by time period.

## Inputs

- `business-hours`: The operating hours of the business
- `staffing-model`: The staffing model (roles, skill levels, minimum coverage by role)

## Outputs

- `shift-types`: Defined shift types with start/end times, break schedules, and applicable roles
- `coverage-matrix`: Required headcount by shift type, day of week, and role

## Process

1. Divide the operating hours into shift blocks (morning, afternoon, evening, overnight as applicable).
2. For each shift, define the start and end times, break duration and timing, and which roles are needed.
3. Build the coverage matrix: how many of each role are needed for each shift on each day of the week.
4. Account for seasonal or event-based variations in coverage needs.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
