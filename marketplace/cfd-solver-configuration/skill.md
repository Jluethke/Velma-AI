# Cfd Solver Configuration

Configure the solver settings: discretization schemes, linear solver, time stepping, and convergence monitoring.

## Inputs

- `governing-equations`: Equation set to solve
- `mesh-requirements`: Mesh resolution and quality metrics
- `flow-classification`: Steady vs transient, compressible vs incompressible

## Outputs

- `solver-settings`: Solver type, discretization scheme orders, relaxation factors, time step (if transient), and convergence criteria
- `convergence-monitoring-plan`: Which residuals to track, what monitor points to set, and what integral quantities to check for convergence

## Process

1. Choose pressure-based solver for incompressible and low-Mach flows (SIMPLE, SIMPLEC, or PISO coupling). Choose density-based solver for compressible flows with shocks (explicit or implicit time integration). Pressure-based with coupled solver is the modern default for general-purpose work.
2. Set spatial discretization: second-order upwind for convective terms as the minimum acceptable order. First-order upwind introduces excessive numerical diffusion and should only be used for initial iterations to stabilize, then switched to second-order. For LES, use central differencing or bounded central to minimize numerical dissipation.
3. For transient simulations, set the time step from the CFL condition: delta_t = CFL * delta_x / (V + a) where CFL < 1 for explicit solvers and CFL can be larger (5-20) for implicit solvers. Also ensure the time step resolves the physical transient: at least 20 time steps per period of the dominant frequency.
4. Set convergence criteria: residuals below 1e-4 as a minimum, 1e-6 for well-converged solutions. Monitor the quantity of interest (drag coefficient, pressure drop, heat transfer rate) and declare convergence when it changes less than 0.1% over the last 100 iterations (steady) or when running averages stabilize (transient).
5. Check global conservation: mass imbalance should be below 0.1% of the inlet mass flow. Energy imbalance should be below 1% of the total energy flux. Large imbalances indicate mesh quality problems, incorrect boundary conditions, or unconverged solutions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
