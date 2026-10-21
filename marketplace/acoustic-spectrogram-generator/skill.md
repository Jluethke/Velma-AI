# Acoustic Spectrogram Generator

Generate spectrograms from validated recordings for visual inspection and automated detection.

## Inputs

- `validated-recordings`: Quality-checked audio files

## Outputs

- `spectrograms`: Time-frequency representations of each recording segment
- `spectrogram-parameters`: FFT size, window type, overlap, and frequency range used

## Process

1. Select FFT parameters based on target frequency range and time resolution.
2. Compute short-time Fourier transforms for each recording.
3. Apply noise floor estimation and spectral subtraction if needed.
4. Store spectrograms as images or arrays for downstream detection.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
