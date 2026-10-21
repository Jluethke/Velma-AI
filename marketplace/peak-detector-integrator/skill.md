# Peak Detector Integrator

Detect peaks in the corrected chromatogram: locate starts, apexes, and ends, then integrate the area under each peak.

## Inputs

- `corrected-chromatogram`: Baseline-corrected signal
- `detection-parameters`: Minimum peak height, minimum area, and slope sensitivity

## Outputs

- `peak-list`: Each peak with retention time, height, area, width, symmetry factor, and plate count
- `integration-report`: Integration events (peak start, apex, end, split, shoulder) for each peak

## Process

1. Detect peak starts and ends using slope threshold or derivative methods.
2. Locate the apex (maximum) of each detected peak.
3. Integrate the area between start and end using trapezoidal or Simpson's rule.
4. Compute peak shape parameters: asymmetry factor, tailing factor, and theoretical plates.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
