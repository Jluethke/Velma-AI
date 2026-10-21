# Light Curve Builder

Build a time-series light curve for a target source from calibrated multi-epoch photometry.

## Inputs

- `calibrated-magnitudes`: Calibrated magnitudes across multiple epochs
- `target-coordinates`: Sky coordinates of the target source

## Outputs

- `light-curve`: Time-series of calibrated magnitudes with timestamps and uncertainties
- `variability-statistics`: Reduced chi-squared, amplitude, and period estimate if periodic

## Process

1. Extract the target magnitude from each epoch
2. Compute differential photometry against stable comparison stars to reduce systematics
3. Assemble the light curve with barycentric time correction
4. Compute variability statistics and search for periodicity (Lomb-Scargle)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
