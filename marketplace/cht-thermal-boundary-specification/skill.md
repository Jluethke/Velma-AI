# Cht Thermal Boundary Specification

Specify all thermal boundary conditions for the conjugate simulation: heat sources, insulation, radiation, and ambient conditions.

## Inputs

- `domain-decomposition`: Solid and fluid domains with interface
- `thermal-problem`: Heat generation rates, ambient conditions, and radiation environment

## Outputs

- `thermal-boundary-set`: Complete thermal boundary condition specification for all surfaces and volumes
- `energy-balance-check`: Expected total heat generation vs total heat removal, confirming the problem is thermally balanced

## Process

1. Volumetric heat generation: specify in W/m^3 for electrically heated components (P = I^2 * R / volume), electronic chips (thermal design power / die area * thickness), or nuclear fuel. Map the heat generation to the correct solid regions in the mesh.
2. External convection boundaries: for surfaces exposed to ambient air, specify the natural convection coefficient from correlations (Churchill-Chu for vertical plates: h = f(Ra, Pr)) or forced convection (Dittus-Boelter for internal flow: Nu = 0.023 * Re^0.8 * Pr^n). These are approximate; if the external flow matters, extend the CFD domain to include it.
3. Radiation boundaries: for high-temperature surfaces (above roughly 200C where radiation is significant), include surface-to-surface radiation using the Stefan-Boltzmann law q = epsilon * sigma * (T_surface^4 - T_ambient^4). For enclosed cavities, compute view factors between surfaces. For external surfaces, radiation to a far-field temperature suffices.
4. Insulated boundaries: zero heat flux (adiabatic) for surfaces with thermal insulation or symmetry planes. Verify that marking a surface as insulated does not prevent heat from leaving the system (energy balance).
5. Energy balance pre-check: total heat generated must equal total heat removed at steady state. Sum all heat sources and compare to the expected heat removal (coolant mass flow * specific heat * delta_T + radiation + natural convection). If they do not balance, a boundary condition is missing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
