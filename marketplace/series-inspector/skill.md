# Series Inspector

Inspect and clean the time series: identify missing values, outliers, irregular spacing, and recording errors.

## Inputs

- `raw-time-series`: The time series data with timestamps and values
- `metadata`: Units, expected range, sampling frequency, known data gaps

## Outputs

- `cleaned-series`: Time series with missing values handled and outliers flagged
- `quality-report`: Summary of issues found and how each was handled

## Process

1. Plot the raw series and visually inspect for gaps, spikes, and drift.
2. Identify missing values and decide on handling (interpolation, carry-forward, or flagging).
3. Detect outliers using domain-appropriate criteria (not just statistical cutoffs).
4. Regularize the time axis if spacing is irregular.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
