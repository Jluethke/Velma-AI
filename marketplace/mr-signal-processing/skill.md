# Mr Signal Processing

Process raw magnetic resonance data: Fourier transform, phase correction, baseline correction, and apodization.

## Inputs

- `raw-mr-data`: Raw FID or k-space data
- `acquisition-protocol`: Parameters needed for proper processing

## Outputs

- `processed-spectrum-or-image`: Frequency-domain spectrum or reconstructed image
- `processing-log`: Record of every processing step and parameter applied

## Process

1. Apply apodization (exponential or Gaussian window) to improve signal-to-noise.
2. Perform Fourier transformation to convert time-domain to frequency-domain.
3. Correct zero-order and first-order phase errors.
4. Flatten the baseline using polynomial or spline fitting.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
