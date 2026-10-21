# Window Applicator

Apply a windowing function to the signal to reduce spectral leakage before transformation.

## Inputs

- `raw-signal`: Time-series array
- `window-type`: Window function (Hann, Hamming, Blackman, Kaiser, or rectangular)

## Outputs

- `windowed-signal`: Signal after applying the window function
- `window-parameters`: Window type, length, and equivalent noise bandwidth

## Process

1. Select the window function based on the analysis goals (frequency resolution vs. sidelobe suppression).
2. Apply the window to the signal segment.
3. Record the equivalent noise bandwidth for amplitude correction.
4. Optionally segment the signal for averaged periodograms.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
