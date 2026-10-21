# Peak Model Fitter

Fit analytical models (Gaussian, Lorentzian, Voigt) to each identified peak and extract center frequency, width, and area.

## Inputs

- `spectrum`: Frequency vs. power array
- `peak-list`: Table of detected peaks with initial frequency and amplitude

## Outputs

- `fitted-peaks`: Table of peaks with fitted center, width, area, and goodness of fit
- `residual-spectrum`: Spectrum minus all fitted peak models

## Process

1. Select a peak shape model appropriate to the physical process.
2. Fit each peak using nonlinear least squares with initial guesses from the peak list.
3. Record center frequency, FWHM, integrated area, and chi-squared for each fit.
4. Subtract all fitted peaks from the spectrum to produce the residual.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
