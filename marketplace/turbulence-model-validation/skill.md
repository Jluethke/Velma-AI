# Turbulence Model Validation

Validate the turbulence simulation against the law of the wall and reference data, so the modeling choice is confirmed by evidence rather than by the solution having converged.

## Inputs

- `grid-sizing`: The grid whose near-wall resolution must be confirmed from the solution
- `resolution-expectation`: The resolved-energy and near-wall assumptions to be checked

## Outputs

- `wall-profile-check`: The near-wall velocity profile compared to the law of the wall, confirming the wall treatment
- `validation-evidence`: Skin friction, separation location, or spectra compared to experiment or reference simulation with the agreement

## Process

1. Confirm the near-wall velocity follows the law of the wall. Plot the mean velocity in wall units u+ against y+ and check the viscous sublayer u+ = y+ for y+ < 5 and the log law u+ = (1/kappa)*ln(y+) + B with kappa = 0.41 and B = 5.0 to 5.2 for 30 < y+ < 300; a profile off the log law means the wall treatment or near-wall grid is wrong, which corrupts skin friction and heat transfer.
2. Check the achieved y+ field against the model requirement. Extract y+ from the solution and confirm it matches the wall treatment target (about 1 for wall-resolved, 30 to 300 for wall functions); patches in the buffer layer (5 < y+ < 30) are where both treatments are invalid and should be re-meshed.
3. For scale-resolving runs, verify the resolved-energy fraction. Estimate the ratio of resolved to modeled turbulent kinetic energy and confirm the resolved fraction meets the target (about 80 percent or more for a credible LES); too much modeled energy means the grid is too coarse and the run is closer to an unsteady RANS than an LES.
4. Compare an integral quantity to reference data. Match skin-friction coefficient, pressure distribution, separation and reattachment locations, or Nusselt number against experiment or a trusted higher-fidelity simulation; agreement within the accuracy target validates the modeling choice, and a systematic offset points to the closure rather than the mesh.
5. Compare spectra or unsteady statistics when the output demands them. For noise or mixing, check the resolved velocity spectrum shows the expected inertial-range slope and that the dominant frequencies match measurements; a spectrum that decays too fast at high wavenumber confirms under-resolution and tells you the scale-resolving method did not deliver what it promised.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
