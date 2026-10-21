# Seismic Event Detection

Detect and locate seismic events from processed waveforms using automated picking, association, and location algorithms.

## Inputs

- `processed-traces`: QC-passed waveforms for the analysis period
- `velocity-model`: 1D or 3D velocity model for the study region

## Outputs

- `event-catalog`: List of detected events with origin time, latitude, longitude, depth, and phase picks
- `location-uncertainties`: Formal error ellipses and RMS residuals for each event

## Process

1. Run STA/LTA or deep-learning phase picker on all station traces
2. Associate picks into events using travel-time consistency checks
3. Locate each event by iterative least-squares inversion against the velocity model
4. Filter the catalog by minimum phase count and maximum RMS residual

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
