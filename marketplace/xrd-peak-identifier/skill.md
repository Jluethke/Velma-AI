# Xrd Peak Identifier

Locate and characterize peaks in the background-stripped diffractogram.

## Inputs

- `stripped-diffractogram`: Background-subtracted intensity data
- `peak-detection-threshold`: Minimum intensity or signal-to-noise ratio for peak acceptance

## Outputs

- `peak-list`: Table of peak positions (two-theta), intensities, and FWHM values
- `peak-fit-residuals`: Goodness-of-fit metrics for each peak profile

## Process

1. Detect candidate peaks using second-derivative or wavelet methods
2. Fit each peak with a Voigt or pseudo-Voigt profile to extract position, intensity, and width
3. Filter peaks below the acceptance threshold
4. Produce the final peak list sorted by two-theta position

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
