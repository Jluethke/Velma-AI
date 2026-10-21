# Batch Monitoring

Monitor new batch or continuous process data against the PCA model and control limits to detect out-of-control events.

## Inputs

- `new-process-data`: Incoming process variable data from the batch or stream being monitored
- `pca-model`: Fitted PCA model from reference data
- `control-limits`: T-squared and Q-residual limits

## Outputs

- `monitoring-results`: Time series of T-squared and Q values with alarm flags
- `alarm-log`: Timestamped list of control limit violations

## Process

1. Scale new observations using the reference-period means and standard deviations
2. Project onto the PCA model to compute T-squared and Q at each time point
3. Flag observations that exceed either control limit
4. Log alarm timestamps and durations for further investigation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
