# Spectral Peak Finder

Identify significant peaks in the amplitude spectrum: locate frequency, amplitude, bandwidth, and signal-to-noise ratio of each peak.

## Inputs

- `amplitude-spectrum`: Magnitude at each frequency bin
- `noise-floor-estimate`: Expected background noise level or method to estimate it

## Outputs

- `peak-table`: Each peak with frequency, amplitude, bandwidth, and SNR
- `noise-floor`: The estimated noise floor used for SNR calculation

## Process

1. Estimate the noise floor using a moving median or percentile method.
2. Find local maxima that exceed the noise floor by a specified threshold.
3. For each peak, measure the center frequency, amplitude, and 3dB bandwidth.
4. Compute the signal-to-noise ratio for each peak.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
