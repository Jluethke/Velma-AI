# Power Density Estimator

Estimate the power spectral density using Welch's method or a multitaper approach for a smooth, unbiased estimate.

## Inputs

- `windowed-signal`: The preprocessed signal
- `estimation-parameters`: Segment length, overlap fraction, taper count

## Outputs

- `psd-estimate`: Power spectral density with frequency axis and confidence bounds
- `spectral-resolution`: Frequency resolution and bandwidth of the estimate

## Process

1. Divide the signal into overlapping segments.
2. Compute the periodogram of each segment (or apply multiple tapers).
3. Average across segments to reduce variance.
4. Compute confidence intervals based on the number of independent segments.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
