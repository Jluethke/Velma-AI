# Rom Stability And Closure

Stabilize the reduced dynamics and treat nonlinear terms efficiently, because a Galerkin reduced model can be unstable even when the full-order model is stable, and nonlinearities otherwise cost the full dimension to evaluate.

## Inputs

- `reduced-system`: The projected dynamics that may need stabilization
- `snapshot-set`: The data used to build nonlinear-term interpolation

## Outputs

- `stabilized-reduced-model`: The reduced model with stabilization or closure added so it stays bounded
- `nonlinear-treatment`: The interpolation scheme that evaluates nonlinear terms at reduced cost

## Process

1. Expect and diagnose reduced-model instability. Truncating the low-energy modes removes the small scales that drain energy in the full system, so a Galerkin reduced model of a convection-dominated or turbulent flow can grow unbounded even though the full model is stable; check the eigenvalues of the reduced operator and watch for energy growth in a test run.
2. Add a closure or stabilization to replace the missing dissipation. Options include adding an eddy-viscosity-like dissipation term tuned so the reduced energy balance matches the full model, Petrov-Galerkin projection with a test basis chosen for stability (least-squares Petrov-Galerkin), or retaining a few extra modes purely for stabilization.
3. Treat nonlinear terms with hyper-reduction, because a naive nonlinear term costs the full dimension n to evaluate even in a reduced model. The discrete empirical interpolation method selects a small set of m interpolation indices and reconstructs the nonlinear term from the values at only those entries, making the online cost scale with m and k rather than n.
4. Build the interpolation basis from nonlinear snapshots. Collect snapshots of the nonlinear term itself, apply a proper orthogonal decomposition to them, and run the interpolation-point selection greedily on the resulting basis; the number of interpolation points m is chosen like the mode count, from the decay of the nonlinear-term singular values.
5. Verify that stabilization did not destroy accuracy. A stabilization strong enough to bound the model can also over-damp it; confirm on a training case that the stabilized model still reproduces the full-order energy and key outputs, and tune the stabilization to the lightest touch that keeps the model bounded.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
