# Turbulence Scale Resolving Selection

Choose a scale-resolving approach when averaged models cannot deliver, selecting among large-eddy simulation, detached-eddy hybrids, and direct simulation by what must be resolved and what can be afforded.

## Inputs

- `modeling-requirements`: The resolved-physics needs that rule out a RANS closure
- `flow-regime-profile`: The Reynolds number and separation that set resolution and cost

## Outputs

- `scale-resolving-method`: The chosen method (LES, wall-modeled LES, DES or DDES, or DNS) with its rationale
- `resolution-expectation`: The fraction of turbulent energy to be resolved and the near-wall treatment the method assumes

## Process

1. Use large-eddy simulation to resolve the energy-containing eddies and model only the small subgrid scales. A well-resolved LES captures about 80 percent or more of the turbulent kinetic energy on the grid and models the rest with a subgrid-scale model; it predicts unsteady separation, mixing, and noise that RANS cannot, at far higher cost.
2. Use direct numerical simulation only at low Reynolds number. DNS resolves every scale down to the Kolmogorov length and needs grid points scaling as Re^(9/4) with time steps scaling similarly, so its cost scales roughly as Re^3; it is a research tool for canonical flows at modest Re and a source of validation data, not a design tool for high-Re hardware.
3. Use a hybrid RANS-LES method to afford high-Re wall-bounded flows with separation. Detached-eddy simulation runs RANS in the attached boundary layer and switches to LES in separated regions; delayed DES (DDES) adds a shield so the model does not switch prematurely inside the boundary layer, avoiding the grid-induced-separation error that plain DES suffers when the grid is ambiguous.
4. Use wall-modeled LES when resolving the near-wall streaks is unaffordable. Wall-resolved LES near-wall cost scales roughly as Re^1.8 because the streak size shrinks in wall units; a wall model that supplies the wall stress from the outer flow reduces this toward Re^0.4 scaling, making high-Re LES feasible at the price of modeling the inner layer.
5. State the resolution expectation the method carries. Record the target resolved-energy fraction, whether the near-wall layer is resolved or modeled, and the subgrid model; these set the grid requirements the next step sizes and are the assumptions the validation must confirm were met.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
