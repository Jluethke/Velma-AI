# Tfs Network Solver Architecture

Assemble and solve the coupled mass, momentum, and energy balances over the network with a Newton iteration, because the pressure-flow system is nonlinear through the friction and component relations.

## Inputs

- `component-models`: The branch relations that enter the conservation equations
- `boundary-set`: The boundary conditions that close the system

## Outputs

- `steady-state-solution`: The converged node pressures and temperatures and branch flows at the operating point
- `solver-diagnostics`: The residual history, iteration count, and the conditioning or convergence issues encountered

## Process

1. Write mass conservation at each node: the sum of branch flows into a node equals the sum out, sum of m_dot = 0, which for incompressible liquid is a volumetric balance. These node equations, together with the branch pressure-flow relations, form the system whose unknowns are node pressures and branch flows.
2. Write the branch momentum (pressure) relation for each branch: the pressure difference between its nodes equals the component loss plus the elevation term, for example P_i - P_j = f*(L/D)*(rho*V^2/2) + rho*g*(z_j - z_i) for a pipe, with the pump adding a rise and the valve a loss. The nonlinearity in V makes the system nonlinear.
3. Solve the nonlinear system with Newton-Raphson. Linearize the node and branch equations about the current guess, assemble the Jacobian of residuals with respect to pressures and flows, solve the linear update, and iterate until the mass and pressure residuals fall below tolerance; the classical Hardy Cross loop method is a special case that corrects one loop flow at a time and converges more slowly.
4. Couple the energy equation for temperatures. Once flows are known, solve node energy balances where each node mixes the enthalpy of incoming streams and each branch adds or removes heat (pipe loss to ambient, heat-exchanger duty); for weak coupling solve flow then temperature, and for strong coupling (temperature-dependent properties) iterate between the flow and energy solves.
5. Provide a good initial guess and watch conditioning. Seed flows from a simple series-parallel resistance estimate and pressures from the boundaries; a poor guess can send the Newton iteration to a nonphysical negative flow or stall it. Monitor the residual history and the Jacobian conditioning, and add flow limits or relaxation if a branch oscillates between forward and reverse flow near zero.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
