# Bend Radius And Layer Stack Design

Calculate the minimum bend radius from material properties, layer count, and copper thickness, and design the flex stackup to meet it.

## Inputs

- `flex-classification`: Static, flex-to-install, or dynamic
- `material-constraints`: Copper type and coverlay requirements
- `layer-count-in-flex`: Number of copper layers that pass through the bend zone
- `copper-weight`: Copper weight on each layer in the bend zone

## Outputs

- `minimum-bend-radius`: Calculated minimum bend radius in mm for the required cycle life
- `flex-stackup`: Layer stackup in the flex region: copper layers, adhesive layers, polyimide substrate layers, with total thickness
- `neutral-axis-location`: Position of the mechanical neutral axis and whether copper layers are balanced above and below it

## Process

1. Calculate total flex thickness: sum all layers in the bend zone (copper, adhesive, polyimide substrate, coverlay). For a single-layer flex: 12 um copper + 25 um polyimide + 25 um coverlay adhesive + 25 um coverlay polyimide = 87 um total.
2. Apply the IPC-2223 bend radius rule: minimum bend radius = thickness * multiplier. For single-layer dynamic flex, the multiplier is 10 (R_min = 10 * t). For dual-layer dynamic flex, the multiplier is 15 to 20. For static flex, the multiplier is 6 for single-layer. These are conservative minimums.
3. Verify copper strain at the minimum bend radius: strain = t_total / (2 * R_bend). For 87 um thickness at R = 0.87 mm (10x multiplier): strain = 0.087 / (2 * 0.87 + 0.087) = 4.8%. RA copper's fatigue limit for 100,000 cycles is approximately 0.3% strain. So 10x is not enough for true dynamic flex at high cycle count; increase to 25x or 50x for > 10,000 cycles.
4. Balance the stackup about the neutral axis: place copper layers symmetrically. In a 2-layer flex, put one copper layer above and one below the polyimide core so the neutral axis falls between them. An unbalanced stackup puts copper at the maximum strain position (outermost surface), doubling the strain compared to a balanced design.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
