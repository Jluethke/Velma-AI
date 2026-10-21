# Ccd Image Calibrator

Calibrate raw CCD images by subtracting bias, dark current, and dividing by the flat field.

## Inputs

- `raw-science-frames`: Raw FITS images from the observing run
- `calibration-frames`: Bias, dark, and flat-field frames taken during the run

## Outputs

- `calibrated-frames`: Science frames with instrumental signatures removed
- `calibration-log`: Record of which calibration frames were applied and quality metrics

## Process

1. Build master bias from the median of bias frames and subtract from all other frames
2. Build master dark (bias-subtracted, exposure-scaled) and subtract from science and flat frames
3. Build master flat from normalized flat frames and divide each science frame by it
4. Log each step and flag frames with anomalous statistics

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
