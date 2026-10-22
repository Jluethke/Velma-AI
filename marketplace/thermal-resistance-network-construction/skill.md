# Thermal Resistance Network Construction

Build a lumped-parameter thermal resistance network from physical geometry before any simulation, to develop engineering intuition about heat flow paths and identify which paths dominate.

## Inputs

- `boundary-conditions`: Thermal boundary conditions
- `heat-source-map`: Component heat sources
- `convection-coefficients`: Surface convection coefficients

## Outputs

- `thermal-resistance-network`: Node-and-resistor network showing conduction, convection, and radiation resistances from each junction to ambient
- `first-pass-temperatures`: Estimated junction temperatures from the resistance network, identifying which components are at risk before running any simulation

## Process

1. For each critical component, trace the heat flow path from junction to ambient. A typical path: junction -> die attach -> lead frame -> solder joint -> PCB copper -> board surface -> air (convection) and board edge -> mounting screw -> chassis (conduction).
2. Calculate conduction resistances: R_cond = L / (k * A) where L is path length, k is thermal conductivity (copper 385 W/mK, FR4 through-plane 0.3 W/mK, FR4 in-plane 15-25 W/mK depending on copper percentage, aluminum 205 W/mK, solder 50 W/mK).
3. Calculate convection resistances: R_conv = 1 / (h * A) where h is from the boundary condition step and A is the exposed surface area. A 25mm x 25mm component top surface with h = 15 W/(m^2*K) has R_conv = 1/(15 * 0.000625) = 107 C/W.
4. Assemble the network as parallel and series resistances. Heat flows through all available parallel paths simultaneously. The effective resistance from junction to ambient is lower than any single path alone.
5. Solve the network: T_junction = T_ambient + P * R_total. Flag any component where the calculated junction temperature exceeds 80% of its rated maximum. These need detailed simulation or design changes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
