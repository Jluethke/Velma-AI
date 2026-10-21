# Fourier Transformer

Compute the frequency-domain representation using FFT or related transform, producing amplitude and phase spectra.

## Inputs

- `windowed-signal`: The preprocessed time-domain signal
- `transform-parameters`: FFT size, overlap, zero-padding, and transform type

## Outputs

- `amplitude-spectrum`: Magnitude at each frequency bin
- `phase-spectrum`: Phase angle at each frequency bin

## Process

1. Choose the FFT size (next power of 2 or zero-padded).
2. Compute the discrete Fourier transform of the windowed signal.
3. Convert complex output to amplitude (magnitude) and phase.
4. Scale the amplitude spectrum to physical units (e.g., amplitude spectral density).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
