# Threshold Definition

Set the thresholds for each metric: static, dynamic, or anomaly-based.

## Inputs

- `selected-metrics`: Metrics to alert on
- `baseline-values`: Baseline statistics for each metric

## Outputs

- `threshold-rules`: Threshold rules for each metric (type, value, evaluation window)
- `alert-channels`: Channel and recipient assignment for each threshold alert

## Process

1. For each metric, choose the threshold type: static (fixed value), dynamic (percentage deviation from rolling average), or anomaly-based (standard deviations from baseline).
2. Set the threshold value based on the baseline statistics and acceptable tolerance.
3. Define the evaluation window (e.g., 5-minute average, 15-minute sum).
4. Assign each alert to a channel and recipient based on the metric's domain (revenue alerts to finance, error rates to engineering).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
