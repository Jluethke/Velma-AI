# Ashby Chart Screening

Use Ashby material property charts to screen the full material universe down to a short list of candidate material families using graphical constraint and objective lines.

## Inputs

- `property-requirements`: Properties with constraints and objectives
- `compatibility-constraints`: Adjacent material and process constraints

## Outputs

- `candidate-materials`: Short list of 3-5 candidate material families that pass all constraints and perform well on objectives
- `screening-rationale`: The Ashby chart plots used and the reasoning for including or excluding each material family

## Process

1. Plot the first Ashby chart with the two most important properties as axes. For a lightweight heat sink: thermal conductivity vs density. Draw a selection line representing the performance index: materials above and to the left of the line meet the objective (high conductivity at low density).
2. Apply constraint lines to eliminate regions. A minimum thermal conductivity of 100 W/mK draws a vertical line. Everything to the left is eliminated. A maximum density of 3000 kg/m^3 draws a horizontal line. Everything above is eliminated.
3. Identify the material families in the surviving region. For the heat sink example: aluminum alloys, copper alloys, and some metal matrix composites survive. Steels are too heavy and too low in conductivity. Polymers are too low in conductivity. Ceramics (AlN, BeO) survive but at high cost.
4. Create a second chart with different property axes to further discriminate. Cost vs thermal conductivity separates aluminum (cheap, good) from copper (more expensive, better) from AlN (very expensive, comparable to aluminum). This second filter typically reduces 8-10 families to 3-5.
5. For each surviving family, identify 2-3 specific alloys or grades. Aluminum family: 6061-T6 (general purpose, good machinability), 6063-T5 (extrusion alloy for heat sinks), 1100 (highest thermal conductivity aluminum but low strength). Record the specific property values for comparison.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
