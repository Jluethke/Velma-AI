# Fea Loading And Boundary Conditions

Apply loads and constraints that accurately represent the physical loading without introducing artificial stress concentrations or over-constraining.

## Inputs

- `component-description`: Physical loading scenario, support conditions, and connection details
- `converged-mesh`: Mesh ready for analysis

## Outputs

- `loaded-model`: FEA model with all loads, constraints, and contact definitions applied
- `bc-verification`: Free-body check confirming reaction forces match applied loads and no rigid body modes remain

## Process

1. Apply constraints that match the physical support: fixed (all 6 DOF) only for truly welded or embedded connections. Pin (3 translations fixed, rotations free) for bolted joints with clearance. Symmetry (normal displacement and out-of-plane rotation fixed) for symmetric problems.
2. Avoid over-constraining: fixing a single node creates a stress singularity (infinite stress at that node, which is physically meaningless). Distribute constraints over the physical contact area. Use remote boundary conditions (rigid or deformable) to connect constraints to the structure through a realistic area.
3. Apply loads as distributed pressures or surface tractions rather than point forces where possible. A point force on a shell element creates a singularity (stress proportional to 1/r). If a concentrated force is the physical reality (pin-loaded hole), model the contact between the pin and hole explicitly.
4. For bolt connections: use pretensioned bolt elements that apply the bolt preload, then carry the external load through a combination of bolt load increase and joint compression relief. The bolt preload is critical for fatigue analysis of bolted joints.
5. Run a free-body check: sum all reaction forces and compare to applied loads. They must balance to within numerical tolerance (< 0.1% error). If they do not balance, a load or constraint is wrong. Check for unintended rigid body modes (zero-frequency modes in a modal analysis) which indicate insufficient constraints.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
