# Baseline Builder

Establish the baseline: what is normal, accounting for trends, seasonality, and patterns.

## Inputs

- `metric-data`: Historical data (at least 30 data points, ideally 90+)
- `metric-description`: What the metric measures and known patterns

## Outputs

- `baseline-model`: Expected value for any given day with confidence band
- `normal-variability`: Typical fluctuation range: standard deviation, IQR, historical min/max

## Process

1. Collect 30+ data points. Identify patterns: trend, seasonality, day-of-week effect.
2. Build the baseline model: expected value for each day based on patterns.
3. Calculate normal variability: standard deviation of residuals (actual minus predicted).
4. This sets the threshold for what counts as an anomaly.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
