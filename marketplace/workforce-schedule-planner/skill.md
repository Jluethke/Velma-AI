# Workforce Schedule Planner

Plan the workforce schedule based on call volume patterns.

## Inputs

- `agent-scripts`: Agent scripts and procedures
- `overflow-rules`: Overflow handling rules

## Outputs

- `staffing-model`: Required staffing levels by hour, day of week, and season
- `shift-schedule`: Agent shift assignments covering all operating hours

## Process

1. Analyze call volume by hour of day and day of week.
2. Calculate the required agents per interval using the Erlang C formula or equivalent.
3. Build the shift patterns to cover the required staffing levels.
4. Account for breaks, training time, and shrinkage (absenteeism, turnover).
5. Document the staffing model and shift schedule.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
