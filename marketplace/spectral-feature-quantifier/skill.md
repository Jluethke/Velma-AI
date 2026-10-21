# Spectral Feature Quantifier

Compute summary metrics from the spectrum: total power, band ratios, harmonic relationships, and spectral slope.

## Inputs

- `spectrum`: Frequency vs. power array
- `fitted-peaks`: Fitted peak parameters

## Outputs

- `spectral-features`: Table of computed features (total power, band ratios, slopes, harmonic indices)
- `feature-interpretation`: Brief interpretation of each feature in context

## Process

1. Integrate total power across the full band and within defined sub-bands.
2. Compute ratios between sub-bands.
3. Check for harmonic relationships among fitted peaks.
4. Fit a power-law or other trend to the spectral envelope.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
