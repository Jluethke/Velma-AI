# Xrd Background Stripper

Remove background signal from the diffractogram to isolate diffraction peaks.

## Inputs

- `diffractogram`: Standardized two-theta vs intensity data
- `background-method`: Method selection: polynomial, spline, or Sonneveld-Visser

## Outputs

- `stripped-diffractogram`: Background-subtracted intensity data
- `background-curve`: The fitted background for inspection

## Process

1. Estimate the background using the selected method with iterative fitting
2. Subtract the background curve from the raw diffractogram
3. Verify that no negative intensities result and that peak shapes are preserved
4. Record the background model parameters for reproducibility

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
