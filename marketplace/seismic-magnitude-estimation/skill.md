# Seismic Magnitude Estimation

Estimate event magnitudes (local, moment, duration) for each cataloged event and assess magnitude completeness of the catalog.

## Inputs

- `event-catalog`: Located events with phase picks and waveform associations
- `processed-traces`: Waveforms for amplitude and spectral measurements

## Outputs

- `magnitude-catalog`: Events with ML, Mw, or Md estimates and station magnitudes
- `completeness-analysis`: Magnitude of completeness (Mc) and Gutenberg-Richter b-value for the catalog

## Process

1. Measure peak amplitudes and compute local magnitude (ML) with path and station corrections
2. Compute moment magnitude (Mw) from spectral fitting where signal-to-noise allows
3. Estimate magnitude of completeness using the maximum curvature method
4. Fit the Gutenberg-Richter frequency-magnitude relation and report the b-value

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
