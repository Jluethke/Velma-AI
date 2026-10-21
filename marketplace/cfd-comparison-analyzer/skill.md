# Cfd Comparison Analyzer

Compare wind tunnel results with CFD predictions to assess simulation accuracy.

## Inputs

- `aero-coefficients`: Experimental CL, CD, CM vs alpha
- `cfd-predictions`: CFD-computed coefficients at matching conditions

## Outputs

- `comparison-plots`: Overlay plots of experimental vs CFD coefficients
- `discrepancy-analysis`: Quantified differences and likely sources (turbulence model, transition, grid)

## Process

1. Interpolate experimental and CFD data to common angle-of-attack points
2. Compute absolute and percent differences for CL, CD, and CM
3. Plot experimental and CFD predictions on the same axes
4. Identify systematic trends in the discrepancies and suggest their likely sources

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
