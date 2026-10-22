# Pile Type Selection

Select the optimal pile type based on load requirements, ground conditions, and site constraints.

## Inputs

- `structural-loads`: Axial (compression, tension), lateral, and moment demands at foundation level
- `ground-conditions`: Soil/rock profile with strength, stiffness, and groundwater from geotechnical investigation

## Outputs

- `selected-pile-type`: Pile type, material, diameter/section, expected length, and installation method
- `pile-feasibility-assessment`: Constructability considerations: access, vibration limits, noise, nearby structures, spoil disposal

## Process

1. Match pile type to ground and load. Driven steel H-piles: good in mixed ground, can penetrate dense layers, easy to extend/cut, but cannot develop large base resistance in soil. Driven precast concrete: high axial capacity in bearing soils, displacement pile (densifies sand), limited by driving stresses. Driven steel pipe: can be open-ended (low displacement) or closed-end (displacement), allows inspection, can be filled with concrete. Drilled shafts (bored piles): large diameter (0.6 to 3.0 m), high axial and lateral capacity, can socket into rock, no vibration, but requires casing in caving ground and wet concrete placement. CFA (continuous flight auger): fast, low vibration, good in soft to medium ground, limited depth (typically < 25 m). Micropiles: small diameter (150 to 300 mm), grouted, for restricted access or underpinning, limited axial capacity per pile.
2. Estimate required pile length. Penetrate through compressible layers to bearing stratum. End-bearing: pile tip in rock or very dense soil. Friction: develop capacity along shaft in competent soil/rock. Typical target: factor of safety 2.0 to 2.5 on ultimate capacity for static analysis, 2.0 for pile load test-verified design.
3. Check site constraints. Vibration limits for adjacent structures (peak particle velocity < 50 mm/s for normal structures, < 12 mm/s for sensitive). Noise limits if residential area. Headroom restrictions (limited-access rigs, sectional casings). Spoil disposal for bored piles (volume = pi/4 * D^2 * L per pile). Contaminated ground: sealed system (CFA) or containment.
4. Preliminary cost comparison. Unit rate per linear meter installed, including mobilization, testing. Compare total foundation cost for each viable option. Consider schedule: driven piles are fast (10 to 20 per day for a typical crew); drilled shafts are slower (1 to 3 per day for large diameter).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
