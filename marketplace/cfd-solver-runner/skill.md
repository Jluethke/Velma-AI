# Cfd Solver Runner

Run the CFD solver to convergence, monitoring residuals and key physical quantities.

## Inputs

- `computational-mesh`: The meshed domain
- `boundary-setup`: Boundary and initial conditions
- `turbulence-model-config`: Turbulence model and solver settings

## Outputs

- `converged-solution`: The converged flow field (velocity, pressure, turbulence quantities)
- `convergence-history`: Residual histories and monitor point values over iterations

## Process

1. Initialize the flow field and begin iterating
2. Monitor residuals (continuity, momentum, turbulence) and physical monitors (drag, mass flow)
3. Adjust under-relaxation or time stepping if convergence stalls
4. Declare convergence when residuals drop below threshold and monitors stabilize

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
