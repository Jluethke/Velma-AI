# Ms Calibration Processor

Calibrate the mass axis and process raw spectra for accurate mass assignment.

## Inputs

- `raw-spectrum`: Uncalibrated mass spectral data
- `calibrant-reference`: Known calibrant masses for the instrument

## Outputs

- `calibrated-spectrum`: Mass spectrum with corrected mass axis
- `mass-accuracy-report`: RMS mass error and calibration residuals

## Process

1. Identify calibrant peaks in the spectrum
2. Fit the calibration function and correct the mass axis
3. Compute the RMS mass error and verify it meets the target accuracy
4. Apply baseline subtraction and noise reduction

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
