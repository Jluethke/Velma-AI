# Output Attribution Per Activity

Attribute a measurable output to each activity using one clear output metric. Activities that resist any output measure are flagged, because unmeasurable output is often absent output.

## Inputs

- `activity-list`: Every activity in the area
- `time-allocation`: Resource each activity consumed

## Outputs

- `activity-output-map`: Each activity paired with its measurable output
- `output-metric-definition`: The single metric used to compare outputs

## Process

1. Define one output metric that applies across activities, such as revenue, resolved cases, or decisions enabled.
2. Attribute a value on that metric to each activity, using ranges where exact numbers are unavailable.
3. Flag any activity that resists measurement and note whether the output is hard to see or simply absent.
4. Keep the attribution honest by crediting an activity only for output it directly causes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
