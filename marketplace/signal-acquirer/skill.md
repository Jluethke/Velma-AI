# Signal Acquirer

Load and inspect the raw time-series or spectral data, checking sample rate, duration, and obvious artifacts.

## Inputs

- `raw-data-source`: File path or instrument connection for the raw signal
- `expected-sample-rate`: Nominal sampling frequency in Hz

## Outputs

- `raw-signal`: Loaded time-series array with timestamps
- `acquisition-report`: Actual sample rate, duration, gaps, and artifact flags

## Process

1. Load the raw data and extract the time and amplitude arrays.
2. Verify the actual sample rate against the expected value.
3. Scan for gaps, clipping, or saturation artifacts.
4. Report signal duration, point count, and any quality issues.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
