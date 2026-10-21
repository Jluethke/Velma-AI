# Boundary Layer Profiling

Diagnose atmospheric boundary layer height, structure, and turbulence from combined surface, profile, and remote sensing data.

## Inputs

- `calibration-report`: Calibrated remote sensing data streams
- `instrument-plan`: Surface flux and turbulence measurements available

## Outputs

- `boundary-layer-heights`: Time series of diagnosed BL height with method and confidence flag
- `turbulence-profiles`: Vertical profiles of turbulent kinetic energy, heat flux, and moisture flux

## Process

1. Apply multiple BL height detection methods (gradient, parcel, Richardson number) to each sonde and lidar profile
2. Reconcile methods into a best-estimate BL height time series with uncertainty bounds
3. Compute turbulence statistics from sonic anemometer data and diagnose stability class (Monin-Obukhov)
4. Build composite diurnal cycles of BL height, entrainment zone thickness, and residual layer structure

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
