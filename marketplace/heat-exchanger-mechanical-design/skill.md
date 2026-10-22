# Heat Exchanger Mechanical Design

Perform mechanical design of the heat exchanger including TEMA type selection, tube sheet, and pressure rating.

## Inputs

- `required-area`: Heat transfer area with overdesign
- `process-conditions`: Pressures, temperatures, and fluid properties
- `overall-htc`: Design heat transfer coefficient

## Outputs

- `tema-type`: TEMA type designation and justification
- `tube-bundle-geometry`: Tube OD, wall thickness, length, pitch, layout, number of tubes
- `shell-specification`: Shell diameter, wall thickness, nozzle sizes, baffle details

## Process

1. Select TEMA type: BEM (fixed tubesheet, cheapest, no thermal expansion allowance), AES (floating head, allows differential thermal expansion, tube bundle removable), AEU (U-tube, allows expansion, lower cost than floating head but cannot clean inside of U-bends). Choose based on temperature difference, cleaning needs, and cost.
2. Set tube geometry: standard tube OD (19.05 or 25.4 mm), wall thickness from pressure rating per ASME B31.3, tube pitch (1.25 to 1.5 times OD), layout angle (30 degree triangular for highest density, 90 degree square for mechanical cleaning). Calculate number of tubes from area and tube length (standard: 3, 4.9, or 6.1 m).
3. Size the shell: estimate shell ID from tube count using the CTP (count prediction) method or tube count tables. Calculate shell-side flow area and verify that shell-side velocity is 0.3 to 1.0 m/s for liquids. Size nozzles for velocity not exceeding 3 to 4 m/s for liquids.
4. Design baffles: single segmental for standard, double segmental for low pressure drop, helical for low vibration. Baffle spacing: minimum 0.2 times shell ID, maximum 1.0 times shell ID. Baffle cut: 25% of shell ID is standard. Check for tube vibration using the Connors criterion for critical velocity.
5. Calculate tube sheet thickness per ASME VIII Division 1. Check for tube-to-tubesheet joint integrity (strength weld vs seal weld). Design for the most severe combination of shell and tube side pressures including startup and shutdown conditions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
