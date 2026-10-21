# Satellite Altimetry Validation

Validate in-situ current measurements against satellite-derived surface currents from altimetry.

## Inputs

- `qc-current-data`: In-situ surface current measurements
- `altimetry-data`: Satellite-derived geostrophic surface current for the measurement area

## Outputs

- `validation-statistics`: Bias, RMSE, and correlation between in-situ and satellite currents
- `validation-figures`: Time series comparison and scatter plots

## Process

1. Extract the satellite geostrophic current at the in-situ measurement location
2. Compare surface layer in-situ current with satellite current using concurrent time windows
3. Compute bias, RMSE, and correlation coefficient for each velocity component
4. Identify systematic differences and their likely causes (ageostrophic flow, spatial resolution)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
