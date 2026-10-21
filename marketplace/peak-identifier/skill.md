# Peak Identifier

Detect peaks in the spectrum, distinguish real peaks from noise floor, and catalog their frequencies and amplitudes.

## Inputs

- `spectrum`: Frequency vs. power array
- `noise-floor-method`: Method to estimate noise (median, percentile, or modeled)

## Outputs

- `peak-list`: Table of detected peaks with frequency, amplitude, and SNR
- `noise-floor-estimate`: Estimated noise power spectral density across the band

## Process

1. Estimate the noise floor using the selected method.
2. Identify local maxima exceeding a threshold above the noise floor.
3. Compute the signal-to-noise ratio for each candidate peak.
4. Filter out peaks below the minimum SNR criterion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
