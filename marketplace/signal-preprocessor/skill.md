# Signal Preprocessor

Prepare the raw signal for spectral analysis: check sampling rate, detrend, handle gaps, and apply a window function.

## Inputs

- `raw-signal`: The time-domain signal with timestamps and values
- `sampling-metadata`: Sampling rate, units, known gaps, and recording conditions

## Outputs

- `windowed-signal`: Preprocessed signal ready for transform
- `preprocessing-log`: Steps taken: detrending method, window type, gap handling

## Process

1. Verify the sampling rate matches metadata and check for irregular spacing.
2. Remove any DC offset and linear trend from the signal.
3. Handle gaps by interpolation or segmentation depending on gap length.
4. Apply a window function (Hanning, Hamming, or Blackman) to reduce spectral leakage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
