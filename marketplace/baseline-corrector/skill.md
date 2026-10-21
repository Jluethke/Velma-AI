# Baseline Corrector

Detect and subtract the chromatographic baseline: remove drift, compensate for gradient effects, and produce a flat baseline for integration.

## Inputs

- `raw-chromatogram`: Detector signal vs. retention time
- `method-parameters`: Gradient profile, detector type, and expected baseline behavior

## Outputs

- `corrected-chromatogram`: Signal with baseline subtracted
- `baseline-trace`: The estimated baseline for quality review

## Process

1. Identify peak-free regions of the chromatogram for baseline anchoring.
2. Fit a smooth curve (polynomial, spline, or asymmetric least squares) through the anchor points.
3. Subtract the fitted baseline from the raw signal.
4. Verify the corrected signal is centered at zero in peak-free regions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
