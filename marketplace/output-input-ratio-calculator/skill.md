# Output Input Ratio Calculator

Compute the output-to-input ratio for each activity and rank them. The ratio, not raw output, reveals the vital few, because a high-output activity that consumes everything is not efficient.

## Inputs

- `activity-output-map`: Activities paired with output
- `output-metric-definition`: The comparison metric

## Outputs

- `ratio-ranked-activities`: Activities ranked by output per unit of input
- `ratio-method-notes`: Assumptions and ranges used in the ratios

## Process

1. Divide each activity's output by the input it consumed to get a ratio.
2. Rank activities from highest to lowest ratio.
3. Record assumptions and ranges so the ranking can be challenged and corrected.
4. Note where two activities are close enough that their order is uncertain.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
