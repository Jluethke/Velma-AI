# Metric Definer

Define each metric with its formula, source, owner, and update frequency.

## Inputs

- `business-questions`: Questions metrics must answer
- `measurement-gaps`: Questions without metrics

## Outputs

- `metric-definitions`: Each metric with name, formula, data source, owner, update frequency
- `metric-targets`: Targets and thresholds for each metric

## Process

1. For each question, define the metric: name, formula, data source, owner.
2. Set the update frequency (real-time, daily, weekly, monthly).
3. Set targets and thresholds (green, yellow, red).
4. Document the lineage from raw data to the metric.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
