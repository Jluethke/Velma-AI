# Tidal Current Decomposition

Separate the current time series into tidal and residual (non-tidal) components using harmonic analysis.

## Inputs

- `qc-current-data`: Quality-controlled current velocities
- `tidal-constituents`: List of tidal constituents to fit (M2, S2, K1, O1, etc.)

## Outputs

- `tidal-current`: Predicted tidal current from the fitted harmonics
- `residual-current`: Non-tidal residual current after removing the tidal prediction
- `tidal-ellipse-parameters`: Semi-major axis, eccentricity, inclination, and phase for each constituent

## Process

1. Perform harmonic analysis on the east and north velocity components using t_tide or UTide
2. Extract tidal ellipse parameters for each resolved constituent
3. Subtract the tidal prediction from the observed current to produce the residual
4. Validate the decomposition by checking explained variance and residual spectrum

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
