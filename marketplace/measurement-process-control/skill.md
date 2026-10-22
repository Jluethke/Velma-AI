# Measurement Process Control

Implement statistical process control for the measurement process itself to detect drift, shifts, and degradation before they corrupt measurement results.

## Inputs

- `gage-rr-results`: Measurement system variation characteristics
- `measurement-capability`: Uncertainty budget and TUR

## Outputs

- `measurement-spc-system`: Control chart scheme for monitoring measurement process stability with check standards and action rules
- `calibration-interval-justification`: Data-driven calibration interval based on measurement process drift history

## Process

1. Select a check standard: a stable artifact whose value is well-known (calibrated traceable to a national standard). The check standard exercises the measurement process under the same conditions as production measurements. It should be of a value representative of the measurement range in use.
2. Measure the check standard at a regular interval (daily, per shift, or per batch depending on the measurement volume and the risk of drift). Record the measured value and the date/time. This forms the data series for the control chart.
3. Construct an individuals (X) and moving range (MR) control chart for the check standard measurements. Calculate the centerline (grand average), UCL = X_bar + 2.66*MR_bar, LCL = X_bar - 2.66*MR_bar. Plot each new measurement and apply the Nelson rules (or Western Electric rules) for detecting out-of-control conditions: 1 point beyond 3-sigma, 8 consecutive points on one side of the centerline, 6 consecutive points trending in one direction.
4. When an out-of-control condition is detected, investigate the root cause before making further production measurements. Common causes: instrument drift (recalibrate), environmental change (temperature excursion), damage (probe tip wear, surface contamination), operator change. Correct the cause and verify the measurement system returns to control before resuming.
5. Use the control chart data to justify calibration intervals. If the measurement process shows no drift or shift over a 12-month period (all points in control), the calibration interval can be extended. If drift is detected before the scheduled calibration, shorten the interval. The goal is to set the interval so that the probability of the measurement drifting out of tolerance between calibrations is below a target (e.g., 5% per NCSL RP-1).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
