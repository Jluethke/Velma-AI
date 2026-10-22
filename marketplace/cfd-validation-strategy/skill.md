# Cfd Validation Strategy

Plan and execute validation of the CFD result against experimental data or analytical solutions.

## Inputs

- `solver-settings`: The complete simulation setup
- `problem-description`: Physical scenario with available experimental or analytical reference data

## Outputs

- `validation-report`: Quantitative comparison to reference data, uncertainty estimates, and documented limitations of the simulation
- `confidence-level`: Assessment of how much to trust the simulation result for the specific quantity of interest

## Process

1. Identify the validation data: experimental measurements (wind tunnel, field data), analytical solutions (for simple geometries), or benchmark results (established test cases like backward-facing step, driven cavity, Ahmed body). Match the simulation conditions exactly to the validation data conditions.
2. Run the mesh convergence study (three meshes minimum, Richardson extrapolation for the Grid Convergence Index). The GCI gives a 95% confidence interval on the grid-converged solution. If the GCI is larger than the acceptable error, refine the mesh further.
3. Compare quantitatively: overlay profiles (velocity, pressure, temperature) at the same spatial locations as the experimental measurements. Compute error metrics: mean absolute error, RMS error, and maximum local error. For integral quantities (drag, lift, heat transfer), compare within the experimental uncertainty band.
4. Assess sensitivity: vary turbulence model, inlet conditions, and mesh topology to quantify how much the result depends on modeling choices. If the result is insensitive to these variations, confidence is higher. If sensitive, document which assumption drives the uncertainty.
5. Document limitations: state clearly what the simulation captures and what it does not. Common limitations: steady RANS misses transient effects, wall functions lose accuracy for separated flows, uniform inlet conditions miss real inlet non-uniformity. The simulation is a prediction only within its validated envelope.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
