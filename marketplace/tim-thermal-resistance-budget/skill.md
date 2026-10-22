# Tim Thermal Resistance Budget

Calculate the thermal resistance budget for the interface, determining how much thermal resistance the TIM is allowed to contribute while keeping junction temperature within spec.

## Inputs

- `component-thermal-data`: Component power dissipation, maximum junction temperature, and package thermal resistance values from the datasheet
- `cooling-solution`: Heat sink or cold plate thermal resistance from the heat sink surface to ambient

## Outputs

- `tim-resistance-budget`: Maximum allowable TIM thermal resistance in C*cm^2/W, derived from the total thermal path budget
- `interface-geometry`: Contact area dimensions, surface roughness and flatness of both mating surfaces, clamping pressure available, and gap to be filled

## Process

1. Calculate the total allowable thermal resistance from junction to ambient: R_total = (Tj_max - T_ambient_max) / P_component. For a component dissipating 15W with Tj_max = 100C and T_ambient = 55C: R_total = 45/15 = 3.0 C/W.
2. Subtract known thermal resistances in the path: R_junction_to_case (from datasheet, typically 0.2-2.0 C/W), R_case_to_TIM_surface (usually negligible for direct die exposure, or equal to package lid resistance), R_heat_sink (from vendor data at the operating airflow).
3. The remainder is the TIM budget: R_TIM_max = R_total - R_jc - R_heatsink. If R_total = 3.0, R_jc = 0.5, R_heatsink = 1.5: R_TIM_max = 1.0 C/W. Convert to area-normalized units: R_TIM * A_contact in C*cm^2/W. For a 30mm x 30mm interface: 1.0 * 9 = 9 C*cm^2/W.
4. Characterize the interface geometry. Measure surface flatness with a dial indicator or profilometer. Heat spreader lids are typically flat within 25-75 microns. Die-exposed packages may have tilt. The gap that the TIM must fill equals the total flatness deviation of both surfaces plus any designed standoff.
5. If the TIM budget is less than 1 C*cm^2/W, you need a high-performance TIM (liquid metal, indium foil, or high-conductivity grease with controlled bond line). Between 1-5 is the range for most thermal pads and good greases. Above 5 gives you freedom to use commodity gap fillers.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
