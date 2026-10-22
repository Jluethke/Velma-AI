# Fea Validation And Error Estimation

Validate the finite element result against an independent calculation and quantify the remaining discretization error, so the analysis is accepted on evidence rather than on the authority of the contour plot.

## Inputs

- `converged-mesh`: The accepted mesh and its solution
- `linearized-or-submodel-stress`: The usable stress values from singularity handling
- `analysis-goal`: The deliverable the validation must support

## Outputs

- `validation-evidence`: Independent checks (hand calculation, handbook factor, reaction balance, energy check) with the percent agreement for each
- `error-estimate`: The estimated discretization error on the reported quantity, for example from a recovery-based error estimator

## Process

1. Check global equilibrium first. The sum of reaction forces at supports must equal the applied external load to within 0.1 percent in each direction; the reaction moments must balance the applied moments. A failure here invalidates everything downstream and usually points to a boundary condition or load-application error.
2. Compare against an independent closed-form or handbook estimate in a region where one exists. For a hole in a wide plate under tension the elastic stress concentration factor is about 3.0 (Kt = 3 for a small circular hole); for a notch use a Peterson chart factor. Agreement within 5 to 10 percent in a simple region builds confidence in the model setup before trusting the complex regions.
3. Use a recovery-based a posteriori error estimator. The Zienkiewicz-Zhu estimator compares the raw element stress field sigma_h to a smoothed recovered field sigma*, and reports a relative error in the energy norm eta = ||sigma* - sigma_h|| / ||sigma*||. Target a global eta under about 5 to 10 percent and inspect the local error map to see where the mesh still needs work.
4. Sanity-check the deformation and reaction magnitudes against first principles. A cantilever tip deflection should track delta = F*L^3/(3*E*I); if the model deflection is off by a large factor, the element formulation, section properties, or constraints are wrong, not the mesh density.
5. Report the result as a value with an error band and a statement of what was validated. Record the quantity of interest, its estimated discretization error, the independent checks and their agreement, and the assumptions (linear elastic, small displacement, idealization limits) that bound where the number may be used.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
