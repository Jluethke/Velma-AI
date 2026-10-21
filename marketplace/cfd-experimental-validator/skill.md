# Cfd Experimental Validator

Compare simulation results against experimental data to assess accuracy and identify discrepancies.

## Inputs

- `extracted-quantities`: Simulation results at measurement locations
- `experimental-data`: Measured values from wind tunnel, PIV, or other experiments

## Outputs

- `validation-metrics`: Quantitative comparison (RMS error, correlation, bias) at each measurement station
- `discrepancy-analysis`: Identification of regions where simulation and experiment disagree and likely causes

## Process

1. Interpolate simulation results to experimental measurement locations
2. Compute point-by-point and integrated comparison metrics
3. Identify regions of good and poor agreement
4. Attribute discrepancies to mesh resolution, turbulence model, boundary conditions, or experimental uncertainty

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
