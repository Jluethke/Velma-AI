# Rpch Mix Optimizer

Shift the activity mix toward the highest ratio work.

## Inputs

- `activity-ranking`: Activities ranked by revenue per constraint hour
- `constraint-capacity`: The total constraint units to fill

## Outputs

- `target-mix`: The activity mix that fills the constraint with the best ratios
- `displaced-activities`: Low-ratio activities pushed out of the mix

## Process

1. Fill the constraint capacity starting from the highest revenue-per-hour activity.
2. Continue down the ranking until the capacity runs out.
3. Record which low-ratio activities are displaced.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
