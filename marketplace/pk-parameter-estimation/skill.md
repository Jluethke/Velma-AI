# Pk Parameter Estimation

Fit the PK model to the data and estimate pharmacokinetic parameters.

## Inputs

- `pk-dataset`: Observed concentration-time data
- `model-structure`: Model equations and initial estimates

## Outputs

- `fitted-parameters`: Estimated PK parameters: CL, Vd, ka, half-life, with standard errors
- `model-diagnostics`: Objective function value, parameter precision, and convergence status

## Process

1. Run the parameter estimation using maximum likelihood (individual) or FOCE/SAEM (population).
2. Verify convergence: successful minimization, no boundary hits, reasonable parameter precision.
3. Compute derived parameters: half-life from CL and Vd, AUC from model predictions.
4. If the model does not converge, simplify the model or adjust initial estimates.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
