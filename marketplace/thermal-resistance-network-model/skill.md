# Thermal Resistance Network Model

Build the thermal resistance network from junction to ambient for each heat-generating component, identifying every thermal resistance in the path.

## Inputs

- `component-power-dissipation`: Power dissipated by each component in watts (from datasheet or measured)
- `package-thermal-data`: Theta_JC (junction to case), Theta_JB (junction to board), and Psi_JT (junction to top) from component datasheets
- `ambient-temperature`: Maximum ambient temperature specification for the product
- `max-junction-temperature`: Maximum allowable junction temperature from component datasheet

## Outputs

- `thermal-budget`: Allowable temperature rise from junction to ambient: T_j_max - T_ambient, and how it is allocated across each thermal resistance in the path
- `thermal-resistance-network`: Complete thermal circuit: R_jc (junction to case top), R_jb (junction to board), R_cs (case to heat sink), R_sa (heat sink to ambient), R_ba (board to ambient), with parallel paths identified
- `dominant-thermal-path`: Which path (top of package to heat sink, or bottom of package through board) carries the majority of heat, with the percentage split

## Process

1. Calculate the thermal budget: delta_T_max = T_j_max - T_ambient. For a component rated at 125C junction max in a 55C ambient, the budget is 70C. Every watt dissipated consumes budget proportional to the total thermal resistance: delta_T = P * R_theta_ja.
2. Build the thermal circuit with two parallel paths: top path (R_jc + R_cs + R_sa) and bottom path (R_jb + R_ba). For exposed-pad packages (QFN, BGA with thermal pad), the bottom path dominates because R_jb is low (the die is directly above the exposed pad). For plastic packages without exposed pads, the top path through a heat sink may dominate.
3. Look up thermal resistances from the datasheet. Theta_JC and Theta_JB are the key parameters. Theta_JA is board-dependent and only valid for the JEDEC test board; do not use it for design. Psi_JT is a characterization parameter for measuring junction temperature from the top of the package, not a true thermal resistance.
4. Identify the dominant path: if the bottom path resistance is less than the top path resistance, the board is the primary heat sink and PCB thermal design is critical. For most modern ICs in exposed-pad packages, 60 to 80% of heat flows through the board.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
