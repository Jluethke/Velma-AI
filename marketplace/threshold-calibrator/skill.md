# Threshold Calibrator

Set the thresholds that trigger action for each metric that needs a link. The threshold is the line between 'normal variation' and 'something changed that requires a response.' Set it too tight and every fluctuation triggers a fire drill. Set it too loose and real problems slide by.

## Inputs

- `metrics-to-link`: Metrics that need action thresholds
- `linked-metrics`: Already-linked metrics, for calibration reference

## Outputs

- `calibrated-thresholds`: For each metric: the green/yellow/red boundaries, derived from historical variance and the goal target
- `threshold-rationale`: Why each threshold is set where it is, so future reviewers can adjust without guessing

## Process

1. Pull the last 12 data points for each metric. Calculate the mean and standard deviation. Normal variation is within 1 standard deviation of the mean.
2. Set yellow at 1.5 standard deviations from the target (worth investigating). Set red at 2 standard deviations (requires action). Adjust for metrics with natural seasonality or trends.
3. For new metrics with no history, set provisional thresholds based on the goal and commit to recalibrating after 8 data points.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
