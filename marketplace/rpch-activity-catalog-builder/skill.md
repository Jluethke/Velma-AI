# Rpch Activity Catalog Builder

List every revenue activity and its use of the constraint.

## Inputs

- `binding-constraint`: The scarce resource to measure against
- `operation-context`: The operation whose activities are cataloged

## Outputs

- `activity-catalog`: Each revenue activity with its revenue per unit
- `constraint-use-per-activity`: Units of the constraint each activity consumes

## Process

1. List each activity that produces revenue.
2. Record the revenue per unit of each activity.
3. Record how many units of the binding constraint each activity consumes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
