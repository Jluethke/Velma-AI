# Cohesion Friction Computer

Compute Mohr-Coulomb and Hoek-Brown strength parameters with statistical confidence.

## Inputs

- `failure-envelope-fit`: Preliminary cohesion and friction angle from Mohr-Coulomb
- `mohr-circles`: All test data points for regression

## Outputs

- `strength-parameters`: Cohesion, friction angle, and Hoek-Brown constants (mi, sigci) with confidence intervals
- `parameter-comparison`: Mohr-Coulomb vs Hoek-Brown fit quality comparison

## Process

1. Perform least-squares regression on sigma-1 vs sigma-3 data for the linear Mohr-Coulomb fit
2. Fit the Hoek-Brown criterion to the same data and extract mi and sigci
3. Compare R-squared and residuals for both failure criteria
4. Report parameters with 95% confidence intervals from the regression

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
