# Baseline Profiler

Build the baseline: the normal range of the metric using historical data. The baseline is what 'normal' looks like, so that 'unusual' can be defined as 'not normal.' Without a baseline, every fluctuation looks like an anomaly.

## Inputs

- `metric-to-monitor`: The metric you want anomaly detection on (response time, daily revenue, heart rate, error count, etc.)
- `historical-data-range`: How much historical data is available (e.g., 90 days of daily values)

## Outputs

- `baseline-profile`: The mean, standard deviation, and shape of the metric's normal distribution, broken down by any relevant segments (day of week, hour, season)
- `baseline-quality`: Whether the baseline is strong (60+ data points, stable distribution) or weak (fewer data points, shifting distribution)

## Process

1. Calculate the mean and standard deviation of the metric over the historical period. Plot the distribution to check whether it is roughly normal, skewed, or bimodal.
2. Check for patterns: does the metric vary by day of week, time of day, or season? If so, build separate baselines for each segment. Monday's normal is not Saturday's normal.
3. Assess baseline quality: 60+ data points with a stable mean is strong. 20-59 points is moderate (widen thresholds by 20%). Fewer than 20 points is weak (use provisional thresholds and commit to recalibrating after 60 points).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
