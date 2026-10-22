# Coupling Topology Classification

Identify which physical fields are coupled, how tightly, and over what interface, because the coupling strength decides every later choice from solver type to time step.

## Inputs

- `physics-and-interfaces`: The physical fields present (fluid, structure, thermal, electromagnetic) and where they interact
- `coupling-question`: The quantity the coupled model must predict and the accuracy it needs

## Outputs

- `coupling-map`: The coupled field pairs with the direction and physical mechanism of each coupling
- `coupling-strength`: A one-way or two-way classification per coupling with an estimate of coupling tightness

## Process

1. Name the coupled fields and the mechanism. Common pairs are fluid-structure interaction (pressure and shear load the structure, structural motion changes the flow domain), thermal-stress (temperature field drives thermal expansion and stress), conjugate heat transfer (fluid and solid share a temperature and heat-flux interface), and electro-thermal (Joule heating raises temperature, temperature changes resistivity).
2. Classify each coupling as one-way or two-way. One-way coupling holds when field A drives field B but B negligibly affects A, for example a temperature field inducing thermal stress in a stiff part that does not change the temperature field. Two-way coupling holds when the feedback is strong enough to change A, for example a flexible wing bending enough to change the aerodynamic loads.
3. Decide one-way versus two-way with a physical ratio, not a guess. For fluid-structure interaction the structural deflection relative to a characteristic flow length, and the ratio of fluid dynamic pressure to structural stiffness, indicate whether motion feeds back. A deflection under about 1 percent of the reference length usually justifies one-way; larger demands two-way.
4. Mark whether each coupling is a surface coupling (data exchanged on a shared interface, as in fluid-structure or conjugate heat transfer) or a volume coupling (fields co-located over a region, as in Joule heating or poroelasticity). Surface coupling needs interface mesh mapping; volume coupling needs field interpolation or a shared mesh.
5. Record the stiffness and density ratios that predict numerical difficulty. A light, stiff structure in a heavy fluid (low structure-to-fluid density ratio) foreshadows the added-mass instability that will constrain the solution strategy, so flag it here before choosing a solver.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
