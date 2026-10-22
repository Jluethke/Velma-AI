# Copper Spreading And Thermal Via Design

Design the PCB copper area for heat spreading and optimize thermal via arrays for heat transfer from component pad to internal copper planes and backside.

## Inputs

- `thermal-resistance-network`: Thermal circuit with R_jb identified
- `dominant-thermal-path`: Confirmation that board path is significant
- `component-power-dissipation`: Power to dissipate through the board
- `stackup-cross-section`: PCB stackup with copper weights and layer count

## Outputs

- `thermal-via-array-design`: Via diameter, plating thickness, pitch, and count in the thermal pad area with calculated thermal resistance
- `copper-spreading-area`: Required copper area on each layer for adequate heat spreading, with the thermal resistance of each spreading layer
- `board-thermal-resistance`: Total R_ba (board to ambient) including via array, copper spreading, and convection from board surfaces

## Process

1. Design the thermal via array under the exposed pad. Each via's thermal resistance: R_via = L / (k * A) where L is the board thickness, k is copper thermal conductivity (385 W/m*K), and A is the cross-sectional area of the copper in the via barrel. For a 0.3 mm drill, 25 um plating, the copper annulus area is pi * ((0.15)^2 - (0.125)^2) = 0.0216 mm^2. For a 1.6 mm board, R_via = 1.6e-3 / (385 * 0.0216e-6) = 192 C/W per via.
2. Parallel N vias: R_total = R_via / N. For 25 vias: R_total = 192/25 = 7.7 C/W. Filled and plated vias (solid copper plug) have approximately 5x lower thermal resistance per via than plated-through vias because the full cross section conducts.
3. Set via pitch to the minimum allowed by the fabricator (typically 0.8 to 1.0 mm for standard drill, 0.5 mm for laser drill). Fill the entire exposed pad area with vias. More vias is always better thermally; the limit is manufacturing capability and cost.
4. Calculate copper spreading on internal planes: heat spreads laterally through copper planes. The effective spreading area depends on copper thickness and thermal conductivity. For 1 oz copper (35 um), heat spreads roughly 10 to 15 mm from the via array before the spreading resistance becomes significant. Larger copper area helps but with diminishing returns. Use the spreading resistance formula: R_spread = 1/(pi * k * t) * (ln(r_spread/r_source) + some correction factor for finite thickness).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
