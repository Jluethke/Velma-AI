# Threshold Type Selector

Choose between static thresholds (fixed boundaries) and dynamic thresholds (moving boundaries that adapt to trends). Static works for metrics with a stable mean. Dynamic works for metrics that trend upward or downward, or that have strong seasonality.

## Inputs

- `baseline-profile`: The baseline statistics and distribution shape
- `baseline-quality`: How strong the baseline is

## Outputs

- `threshold-type`: Static (fixed boundaries) or dynamic (moving boundaries), with the rationale
- `threshold-parameters`: For static: the fixed upper and lower bounds. For dynamic: the window size, the recalculation frequency, and the deviation multiplier

## Process

1. Check whether the metric's mean is stable over time. If the mean has shifted by more than 1 standard deviation over the historical period, the metric has a trend and static thresholds will either fire constantly (trend moves away from baseline) or never fire (trend moves toward baseline).
2. For stable metrics: use static thresholds set at the mean plus or minus N standard deviations. 2 sigma catches 5% false positive rate. 3 sigma catches 0.3%.
3. For trending or seasonal metrics: use dynamic thresholds with a rolling window (last 30 days). Recalculate the mean and standard deviation at each measurement interval. The thresholds move with the metric's natural evolution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
