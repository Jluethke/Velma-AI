# Josephson Junction Fabrication

Fabricate Josephson junctions with controlled critical current using shadow evaporation and oxidation control.

## Inputs

- `junction-specification`: Target junction area, critical current density, and resistance
- `qubit-type-and-parameters`: Qubit parameters requiring specific junction properties

## Outputs

- `fabrication-process-recipe`: Complete process flow: resist, evaporation, oxidation, liftoff
- `junction-characterization-data`: Measured Rn distribution, Ic uniformity, and yield
- `process-control-parameters`: Critical parameters and their tolerances for reproducibility

## Process

1. Prepare the substrate. High-resistivity silicon (> 10 kOhm-cm) or sapphire to minimize dielectric loss. Clean with piranha or oxygen plasma. For highest coherence, the substrate surface treatment (HF dip, thermal oxidation, surface passivation) strongly affects T1 through surface dielectric loss.
2. Pattern the junction using Dolan bridge (shadow evaporation) technique. Spin bilayer resist (bottom: copolymer MMA/MAA for undercut, top: PMMA for resolution). E-beam lithography defines the junction area and the bridge structure. Develop to create the undercut profile. The bridge width and resist stack control the angle-dependent shadow geometry.
3. Deposit aluminum and form the tunnel barrier. First evaporation at angle theta1 deposits the bottom electrode (typically 20-40nm Al). In-situ oxidation: introduce controlled O2 pressure (0.1-10 mbar) for a controlled time (1-30 minutes) to grow the AlOx tunnel barrier. The oxidation parameters directly set the critical current density: higher pressure*time product gives thicker barrier and lower Jc. This is the most critical step for reproducibility.
4. Second evaporation at angle theta2 (opposite direction) deposits the top electrode through the same resist mask, overlapping the oxidized bottom electrode only in the junction area (defined by the shadow geometry). Liftoff in warm solvent removes the resist and excess metal. The junction area is defined by the overlap of the two angle-deposited films.
5. Characterize the junctions. Measure room-temperature resistance of each junction (4-point probe or on-chip test structures). Rn variation of +/-5% across a wafer is typical for a controlled process. Calculate the expected Ej and qubit frequency from the measured Rn. For a processor, the frequency spread from junction variation must be within the design's collision-free window.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
