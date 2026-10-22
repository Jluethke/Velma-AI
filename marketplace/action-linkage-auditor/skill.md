# Action Linkage Auditor

For each metric in the inventory, determine whether it has a linked action. A linked action means: when this metric crosses a threshold, a specific person does a specific thing. Most metrics fail this test.

## Inputs

- `metric-inventory`: The complete list of tracked metrics

## Outputs

- `linked-metrics`: Metrics that have a defined action when they move, with the action and owner documented
- `unlinked-metrics`: Metrics that no one acts on, regardless of their value

## Process

1. For each metric, ask: in the last 90 days, did anyone take a specific action because this metric changed? Not 'discussed it in a meeting,' but actually changed something.
2. If yes, document: what threshold triggered the action, what the action was, and who did it. That is a linked metric.
3. If no, or if the answer is 'we would if it moved enough,' classify it as unlinked. 'Would' is not the same as 'did.'

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
