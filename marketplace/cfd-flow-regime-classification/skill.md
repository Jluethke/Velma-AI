# Cfd Flow Regime Classification

Classify the flow physics to determine which governing equations and simplifications apply.

## Inputs

- `problem-description`: Physical scenario: geometry, fluid, velocities, temperatures, and the quantity of interest
- `accuracy-requirements`: How accurate the result must be and what trade-offs between fidelity and compute cost are acceptable

## Outputs

- `flow-classification`: Compressible vs incompressible (Mach number), laminar vs turbulent (Reynolds number), steady vs transient, single-phase vs multiphase, and whether buoyancy, radiation, or chemical reactions matter
- `governing-equations`: Which equation set to solve: incompressible Navier-Stokes, compressible Euler/NS, energy equation coupling, species transport if reactive

## Process

1. Compute the Reynolds number Re = rho * V * L / mu for the characteristic length scale and velocity. If Re is below the critical value for the geometry (roughly 2300 for internal pipe, 5e5 for flat plate), the flow is laminar. Above that, it is turbulent or transitional.
2. Compute the Mach number Ma = V / a where a is the speed of sound. If Ma < 0.3, the flow is effectively incompressible (density variation < 5%). Between 0.3 and 1.0, compressibility matters but no shocks form. Above 1.0, use a compressible solver with shock-capturing capability.
3. Check the Rayleigh number Ra = g * beta * delta_T * L^3 / (nu * alpha) if there is a temperature difference. If Ra exceeds roughly 1e8, natural convection is turbulent. If Ra is comparable to the forced convection Richardson number Ri = Gr/Re^2 near 1, mixed convection must be modeled.
4. Determine if the flow is steady or transient from the physics: vortex shedding (Strouhal number), pulsatile flow, or time-varying boundary conditions require transient simulation. If the goal is time-averaged quantities and the flow is statistically steady, RANS with steady solver may suffice.
5. Identify multiphase behavior: free surface (VOF), dispersed phase (Eulerian-Lagrangian), or cavitation. Each adds equations and complexity. Only include if the quantity of interest depends on the phase interaction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
