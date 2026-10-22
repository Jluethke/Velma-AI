# Rpch Throughput Calculator

Compute revenue per constraint hour for each activity.

## Inputs

- `activity-catalog`: Activities with their revenue
- `constraint-use-per-activity`: Constraint hours each activity consumes

## Outputs

- `revenue-per-hour-table`: Revenue per constraint hour for each activity
- `activity-ranking`: Activities ranked from highest to lowest ratio

## Process

1. Divide each activity's revenue by the constraint hours it consumes.
2. Build a table of revenue per constraint hour.
3. Rank the activities from highest to lowest ratio.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
