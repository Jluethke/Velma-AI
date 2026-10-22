# Coupling Iteration Convergence

Drive the partitioned coupling iteration to a converged interface state with relaxation that tames the added-mass instability, so the coupled result at each step is the true fixed point, not a snapshot of a diverging exchange.

## Inputs

- `transfer-scheme`: How interface quantities are exchanged each sub-iteration
- `coupling-strength`: The tightness that sets how aggressive the relaxation must be

## Outputs

- `coupling-residual-criterion`: The interface residual norm and tolerance that define a converged coupling step
- `relaxation-scheme`: The under-relaxation or quasi-Newton acceleration applied to reach the fixed point

## Process

1. Define the interface residual as the change in the exchanged field between successive sub-iterations, for example r_k = d_k_new - d_k_old for interface displacement. Declare the coupling step converged when the relative residual ||r_k||/||d_k|| falls below about 1e-3 to 1e-4, tighter when the time integration is sensitive.
2. Recognize the added-mass instability. In fluid-structure interaction with an incompressible or dense fluid, the fluid acts as extra mass on the structure, and a plain fixed-point (Gauss-Seidel) exchange diverges when the fluid-to-structure density ratio is large, regardless of time step. This is a property of the partitioned scheme, not a bug.
3. Apply fixed under-relaxation as the first defense: update the exchanged field as d_new = omega*d_computed + (1 - omega)*d_old with a relaxation factor omega between about 0.1 and 0.8. Small omega stabilizes tight coupling but slows convergence, so it is a floor, not the goal.
4. Prefer dynamic acceleration for efficiency. Aitken relaxation adapts the factor each sub-iteration as omega_(k+1) = -omega_k*(r_k dot (r_(k+1) - r_k))/||r_(k+1) - r_k||^2, which greatly speeds fixed-point convergence at near-zero cost. Interface quasi-Newton (IQN) methods build an approximate interface Jacobian from the residual history and converge in a handful of sub-iterations even in the added-mass regime.
5. Cap the sub-iterations and monitor divergence. Set a maximum sub-iteration count per time step (for example 20) and treat non-convergence as a signal to strengthen relaxation, switch to a quasi-Newton accelerator, or reconsider a monolithic solve, rather than reducing the time step, which does not cure the added-mass divergence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
