# Cfd Turbulence Model Selection

Select the turbulence model that matches the flow physics, mesh resolution budget, and accuracy needs.

## Inputs

- `flow-classification`: Flow regime, separation behavior, and turbulence characteristics
- `accuracy-requirements`: Acceptable level of modeling error for the target quantity

## Outputs

- `turbulence-model`: Selected model (SA, k-epsilon, k-omega SST, RSM, DES, LES, or DNS) with configuration parameters
- `mesh-requirements`: Wall resolution (y+ target), mesh density away from walls, and cell count estimate

## Process

1. For attached boundary layers and simple shear flows: k-omega SST is the default industry choice. It blends k-omega near walls (accurate boundary layer) with k-epsilon in the freestream (avoids freestream sensitivity). Requires y+ around 1 for best accuracy or y+ 30-300 with wall functions.
2. For flows with massive separation (bluff bodies, stall): standard RANS models poorly predict separation location and recirculation zone size. Use DES (detached-eddy simulation) which resolves large eddies in separated regions while modeling the boundary layer with RANS. Mesh must be fine enough in the separation region that the DES length scale is smaller than the local mesh size.
3. For flows where turbulence anisotropy matters (swirling flows, secondary flows in ducts): Reynolds Stress Model (RSM) captures anisotropy that two-equation models miss, at the cost of 7 equations instead of 2 and stiffer numerics.
4. For flows where temporal fluctuations matter (aeroacoustics, mixing, combustion): LES resolves the energy-containing eddies and models only the subgrid scales. Cell count scales as Re^(9/5) for wall-resolved LES, making it practical only for moderate Reynolds numbers or wall-modeled LES.
5. DNS resolves all scales down to the Kolmogorov length. Cell count scales as Re^(9/4). Practical only for Re below roughly 10,000 and simple geometries. Use for validating RANS models, not for engineering design.
6. For the chosen model, define y+ target: y+ around 1 for low-Re models and LES, y+ 30-300 for wall-function models. Estimate the first cell height from y+ = (rho * u_tau * y) / mu where u_tau = sqrt(tau_wall / rho).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
