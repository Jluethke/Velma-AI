# Spectral Transformer

Compute the frequency-domain representation using FFT, wavelet transform, or Lomb-Scargle periodogram for unevenly sampled data.

## Inputs

- `windowed-signal`: Windowed time-series segment(s)
- `transform-method`: FFT, wavelet, or Lomb-Scargle
- `window-parameters`: Window parameters for amplitude correction

## Outputs

- `spectrum`: Frequency vs. power or amplitude array
- `transform-metadata`: Frequency resolution, Nyquist frequency, and transform parameters

## Process

1. Apply the selected transform to each windowed segment.
2. Correct amplitudes for the window function's energy loss.
3. Average across segments if using Welch's method.
4. Record the frequency resolution and Nyquist limit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
