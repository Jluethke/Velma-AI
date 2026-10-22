# Explicit Contact And Mesh Setup

Configure contact algorithms and mesh for large-deformation explicit simulation.

## Inputs

- `impact-scenario`: Bodies involved, expected contact interactions, and deformation severity
- `material-cards`: Material models for all parts

## Outputs

- `contact-definitions`: Contact type, friction coefficient, and penalty stiffness for each contact pair
- `explicit-mesh`: Mesh with element size and quality appropriate for the deformation level and time step target

## Process

1. Choose contact algorithm: penalty-based contact (most common in explicit codes) adds a spring force proportional to penetration. Penalty stiffness should be high enough to keep penetration below 5-10% of the element thickness. Too high causes instability (time step drop); too low allows unrealistic penetration.
2. Define contact pairs: self-contact (a part folding onto itself), part-to-part contact (impactor to target), and tied contact (welded interfaces that should not separate). For large models, use automatic contact detection (single-surface contact) that checks all exterior faces against all others.
3. Set friction: static and dynamic friction coefficients from material pair data. Steel-on-steel: 0.15-0.30 lubricated, 0.50-0.80 dry. For unknown friction, run a sensitivity study: if the result does not change with friction (energy absorption in a crush), the exact value does not matter.
4. Mesh for explicit: prefer hexahedral elements (8-node, single integration point with hourglass control). Hex elements have a larger stable time step than tets of similar size. For complex geometry where hex meshing is impractical, use tetrahedral elements but increase mesh density to compensate for tet stiffness.
5. Size elements to capture the deformation: in crush zones, elements should be small enough that several elements span the expected fold wavelength. In regions away from contact and deformation, coarser elements save computation. Transition from fine to coarse gradually (no more than 2:1 size ratio at transitions).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
