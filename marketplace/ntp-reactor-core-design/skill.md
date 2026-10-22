# Ntp Reactor Core Design

Design the reactor core that heats hydrogen propellant: select fuel element type, calculate power level from thrust requirement, and design the neutron control system.

## Inputs

- `thrust-requirement`: Required thrust level (e.g., 25 klbf for a human Mars mission engine)
- `isp-target`: Target specific impulse (typically 850 to 950 s for NTP)
- `mission-profile`: Number of burns, total burn time, and restart requirements

## Outputs

- `core-geometry`: Fuel element type, number of elements, core diameter and length
- `power-level`: Reactor thermal power required to achieve the thrust at target Isp
- `reactivity-control`: Control drum or rod design for reactor startup, power control, and shutdown

## Process

1. Calculate required reactor power: P_thermal = F * g * Isp * cp_H2 * (T_chamber - T_inlet) / (Isp * g)^2. Simplified: for 900 s Isp, chamber temperature is about 2700K, and each pound of thrust requires approximately 32 kW of thermal power. A 25,000 lbf engine needs about 800 MW thermal.
2. Select fuel element type: NERVA-heritage graphite composite (H2 temperature limited to 2500K, Isp ~ 850 s, proven in NERVA/Rover tests). CERMET (ceramic-metallic: UO2 in tungsten matrix, can reach 2700K+, Isp ~ 900+ s, more resistant to hydrogen corrosion). LEU HALEU fuel (19.75% enriched to stay below weapons-grade threshold, modern regulatory environment).
3. Size the core: number of fuel elements from the power per element limit (each NERVA-heritage element: about 1 MW, so 800 elements for an 800 MW core). Core diameter from element packing (hex lattice with tie tubes for structural and moderator function). Core length from required hydrogen heating path length (typically 0.9 to 1.3 m).
4. Design reactivity control: rotating control drums at the core periphery (absorber segment of B4C or Eu2O3 facing inward for shutdown, rotated outward for criticality). Calculate drum worth from the reactivity swing required: cold-to-hot reactivity loss (hydrogen worth, temperature defect, xenon poisoning for extended runs) must be within the drum authority.
5. Address hydrogen compatibility: hot hydrogen attacks graphite (mid-band corrosion above 2200K). NERVA elements used NbC or ZrC coating on flow channels. CERMET elements are inherently resistant. Design for the mission burn time: short burns (minutes) for impulsive maneuvers have less corrosion concern than sustained burns.
6. Verify criticality safety: the reactor must remain subcritical under all credible accident scenarios (launch abort into water, compaction from impact). The water submersion scenario adds moderation and can increase reactivity. Design sufficient shutdown margin with drums in the shutdown position to remain subcritical even when flooded.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
