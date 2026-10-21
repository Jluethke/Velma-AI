# Fid Processor

Process the free induction decay (FID) into a frequency-domain spectrum: apply apodization, zero-fill, Fourier transform, phase correct, and reference.

## Inputs

- `raw-fid`: The time-domain NMR signal (FID) with acquisition parameters
- `processing-parameters`: Apodization function, zero-fill factor, and referencing standard

## Outputs

- `processed-spectrum`: Frequency-domain spectrum with chemical shift axis in ppm
- `processing-log`: Apodization, zero-fill, phase correction values, and reference offset applied

## Process

1. Apply an apodization (window) function to the FID (exponential or Gaussian) to improve line shape.
2. Zero-fill to increase digital resolution.
3. Apply the Fourier transform to convert from time domain to frequency domain.
4. Phase correct (zero-order and first-order) and reference the chemical shift axis to the internal standard.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
