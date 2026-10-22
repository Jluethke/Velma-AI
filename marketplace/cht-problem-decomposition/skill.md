# Cht Problem Decomposition

Decompose the conjugate heat transfer problem into its thermal and fluid domains, define the interface, and select the coupling approach.

## Inputs

- `thermal-problem`: Physical scenario: heat source, solid geometry, coolant type and flow rate, and the temperature or heat flux to predict
- `accuracy-requirements`: Required accuracy in temperature prediction and acceptable computational cost

## Outputs

- `domain-decomposition`: Solid domain (conduction), fluid domain (convection), and the shared interface where heat and temperature are exchanged
- `coupling-method`: Direct (monolithic) or partitioned (iterative exchange) coupling, with update frequency and convergence criterion

## Process

1. Identify the solid domain (the structure conducting heat) and the fluid domain (the coolant or gas removing heat). The interface between them is where the thermal boundary condition transitions from Dirichlet (temperature) on one side to Neumann (heat flux) on the other. At the interface, both temperature continuity and heat flux continuity must hold.
2. Choose coupling method: monolithic (solve solid and fluid simultaneously in one solver) is the most accurate and stable but requires a single code that handles both. Partitioned (separate solid and fluid solvers exchanging boundary data) is more flexible but requires iteration for convergence. One-way coupling (fluid to solid only) is acceptable when the solid temperature change does not significantly affect the flow.
3. For partitioned coupling, define the exchange: the fluid solver sends the heat transfer coefficient h and reference temperature T_ref to the solid solver, which returns the wall temperature. Iterate until the interface temperature changes less than 0.1 K between iterations. Under-relaxation (alpha = 0.3 to 0.7) prevents oscillation.
4. Set the mesh at the interface: the fluid and solid meshes do not need to be conformal (matching node-for-node), but non-conformal interfaces require interpolation which can introduce small conservation errors. For high-accuracy work, use conformal interface meshes.
5. Estimate the Biot number Bi = h*L/k_solid. If Bi < 0.1, the solid temperature is nearly uniform and a lumped-capacitance model suffices (no FEA needed in the solid). If Bi > 0.1, temperature gradients in the solid matter and full CHT is needed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
