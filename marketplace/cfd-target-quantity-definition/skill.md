# Cfd Target Quantity Definition

Fix the scalar quantity of interest the study must converge and the tolerance that defines convergence, so that every later mesh decision is judged against one number rather than a picture.

## Inputs

- `simulation-objective`: What the CFD study must predict (drag, heat transfer, pressure drop, separation point) and the decision it feeds
- `geometry-and-flow-conditions`: Reference length, inlet velocity, fluid properties, Reynolds and Mach numbers

## Outputs

- `target-quantity`: One or two scalar quantities of interest with their definition, for example drag coefficient Cd or area-averaged Nusselt number
- `convergence-tolerance`: Allowed grid-induced uncertainty on the target quantity, stated as a percent band such as 2 percent of Cd

## Process

1. Pick a scalar quantity of interest that maps directly to the engineering decision. Integrated quantities such as drag coefficient Cd = 2*Fx/(rho*U^2*A), lift, total pressure drop, or area-averaged Nusselt number converge faster and more monotonically than point values like peak wall shear, so prefer them when the decision allows.
2. Compute the reference Reynolds number Re = rho*U*L/mu and Mach number Ma = U/c. These set whether the flow is laminar or turbulent and whether compressibility matters, which in turn drives near-wall resolution and the grid count you must budget for.
3. State the convergence tolerance as a percent of the target, not as an absolute residual. A typical external-aerodynamics drag study targets grid-induced uncertainty under 2 percent of Cd; a heat-transfer study often needs 5 percent on Nusselt number because wall-gradient quantities are more mesh-sensitive.
4. Separate iterative convergence from grid convergence. Drive solver residuals down at least 3 to 4 orders of magnitude and confirm the target quantity is steady to within one tenth of the grid tolerance before you trust any single mesh, otherwise an unconverged solve masquerades as mesh error.
5. Record the operating point (angle of attack, mass flow, wall temperature) that the convergence study locks to. Grid independence is established at one condition; document that the chosen mesh must be re-checked if the flow regime changes, for example when separation appears at higher incidence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
