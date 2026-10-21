# Kinetics Model Report

Produce the chemical kinetics report with the mechanism, fitted constants, validation, and sensitivity results.

## Inputs

- `best-mechanism`: The selected reaction mechanism
- `mechanism-comparison`: Comparison across candidate mechanisms
- `sensitivity-coefficients`: Sensitivity analysis results

## Outputs

- `kinetics-report`: The full kinetics modeling report
- `model-files`: ODE system, fitted parameters, and integration scripts for reproducibility

## Process

1. Present the reaction mechanism, rate equations, and estimated constants with uncertainties.
2. Show model-data overlays and residual analysis.
3. Summarize sensitivity analysis and which parameters need tighter experimental constraints.
4. Provide the computational files for others to reproduce the results.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
