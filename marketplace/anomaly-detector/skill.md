# Anomaly Detector

Detect unusual pollution events or environmental anomalies that deviate from established baselines and seasonal norms.

## Inputs

- `qc-dataset`: Quality-controlled data with seasonal patterns characterized
- `baseline-statistics`: Historical mean, variance, and percentile distributions per parameter
- `alert-thresholds`: Regulatory or health-based thresholds for immediate notification

## Outputs

- `anomaly-list`: Detected exceedances and anomalies with timestamps, durations, and magnitudes
- `alert-notifications`: Triggered alerts for threshold exceedances requiring response
- `event-characterization`: Duration, peak value, and estimated load for each detected event

## Process

1. Calculate rolling statistics and seasonal baselines from the historical record
2. Compare incoming data against baselines using z-score or percentile methods
3. Classify deviations as within normal variability, noteworthy, or exceedance
4. Characterize each anomaly event by start time, peak, duration, and total load
5. Generate alerts for regulatory threshold exceedances

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
