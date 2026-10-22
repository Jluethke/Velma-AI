# Punch Item Assigner

Assign each punch list item to the responsible subcontractor.

## Inputs

- `deficiency-list`: List of deficiencies with location and description
- `walk-summary`: Summary of findings

## Outputs

- `assigned-punch-list`: Punch list with responsible party for each item
- `assignment-notices`: Notices sent to each subcontractor

## Process

1. Match each deficiency to the responsible subcontractor based on scope.
2. Set completion deadlines based on severity and project schedule.
3. Send the assignment notice with photos and descriptions to each sub.
4. Log the assignments in the punch list tracker.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
