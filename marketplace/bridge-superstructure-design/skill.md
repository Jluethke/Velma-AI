# Bridge Superstructure Design

Design the bridge superstructure: girders, deck, and connections.

## Inputs

- `member-forces`: Design forces at all critical sections
- `selected-bridge-type`: Bridge type and preliminary dimensions

## Outputs

- `superstructure-design`: Girder sections, deck reinforcement, shear connectors, diaphragms, and cross-frames
- `superstructure-drawings-data`: Key dimensions and reinforcement schedules for drafting

## Process

1. For steel composite girders: select plate sizes for flanges and web. Flange area from Mu/(phi*Fy*d_eff). Web depth from span-to-depth ratio, web thickness from shear and web buckling (compact, noncompact, or slender classification). Check all limit states: flexure (plastic moment or yield moment depending on section class), shear (end panels, interior panels with tension field action), fatigue at detail categories (welded stiffeners, coverplates, shear connectors).
2. For prestressed concrete girders: select strand pattern for required prestress force. Initial prestress force from service load conditions: at transfer, concrete stress at bottom fiber < 0.60*f'ci, at top fiber tension < 3*sqrt(f'ci). At service: bottom tension < 6*sqrt(f'c) for Class U (uncracked). Verify ultimate flexural capacity Mn > 1.2*Mcr to ensure ductile failure. Check shear using modified compression field theory (AASHTO Section 5).
3. Design the deck slab. Empirical design method if conditions are met (4 girders, no skew > 25 degrees, S < 4.1 m): minimum 175 mm top mat, 175 mm bottom mat isotropic reinforcement. Otherwise, strip method: 1-foot wide strip, design for HL-93 wheel load with dynamic allowance, one-way slab between girders.
4. Design shear connectors for composite action. Stud shear connectors: fatigue-controlled (number per unit length from Vsr*I/(Q*Zr) where Zr is allowable fatigue range per stud). Check ultimate capacity: total studs between zero and max moment must provide at least the lesser of 0.85*f'c*b_eff*ts or As*Fy.
5. Design cross-frames and diaphragms. Intermediate cross-frames at spacing not exceeding 7.5 m (AASHTO). End diaphragms for load distribution at bearings. K-frame or X-frame configuration. Check for wind and construction (wet concrete) load paths.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
