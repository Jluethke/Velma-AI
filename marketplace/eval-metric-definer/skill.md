# Eval Metric Definer

Define the evaluation metrics for the task.

## Inputs

- `task-description`: What the model does
- `quality-requirements`: What counts as good performance

## Outputs

- `metric-set`: Selected metrics with definitions and thresholds
- `baseline-targets`: Target values for each metric

## Process

1. Identify the automatic metrics for the task type.
2. Define human evaluation dimensions (fluency, relevance, correctness).
3. Set the threshold for each metric.
4. Document how each metric is computed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
