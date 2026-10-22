# Root Cause Tracing

Trace each heavy category back to the point where the work was not done right the first time. The cause lives upstream of where the failure demand arrives, in the step that should have handled it correctly.

## Inputs

- `failure-categories`: Failure demand grouped by cause
- `category-volumes`: Volume per category

## Outputs

- `root-causes`: The first-time-right failure behind each category
- `cause-to-category-map`: Which cause produces which failure-demand category

## Process

1. For each heavy category, find the earlier step that should have resolved the need correctly.
2. Identify why that step did not do it right the first time.
3. Map each root cause to the categories and volume it produces downstream.
4. Note where one cause feeds several categories, since fixing it clears more than one.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
