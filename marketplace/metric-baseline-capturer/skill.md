# Metric Baseline Capturer

Capture the baseline value of the metric to model, its current rate of change, and the compounding frequency.

## Inputs

- `metric-to-model`: The specific metric: savings balance, revenue, skill level, weight, customer count, or any other measurable quantity
- `metric-history`: At least 3 data points over time showing the metric's current trajectory

## Outputs

- `baseline-value`: The current value of the metric
- `current-growth-rate`: The current rate of change per compounding period (daily, weekly, monthly), calculated from the history
- `compounding-frequency`: How often the metric compounds: daily for habits, monthly for finances, quarterly for business metrics

## Process

1. Record the current value of the metric. This is the starting point for all projections.
2. Calculate the current rate of change from the history. Use the compound growth rate formula: (ending value / beginning value) raised to (1 / number of periods) minus 1. This gives the per-period growth rate.
3. Determine the natural compounding frequency. Financial balances compound monthly (or daily for interest). Business revenue compounds monthly or quarterly. Personal habits compound daily (each day's effort builds on the previous).
4. Record the baseline: current value, current per-period growth rate, and compounding frequency. This is the 'do nothing differently' trajectory.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
