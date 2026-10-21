# Photometric Calibrator

Calibrate instrumental magnitudes to a standard photometric system using standard star observations or catalog cross-matching.

## Inputs

- `photometry-table`: Instrumental magnitudes for all sources
- `standard-catalog`: Reference photometric catalog (Landolt, APASS, PS1, Gaia)

## Outputs

- `calibrated-magnitudes`: Magnitudes on the standard system with zero-point and color terms
- `calibration-residuals`: Residuals against the standard stars and the derived transformation

## Process

1. Cross-match detected sources with the standard catalog
2. Fit the zero point, extinction coefficient, and color term
3. Apply the transformation to all sources
4. Report the residuals and RMS of the calibration

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
