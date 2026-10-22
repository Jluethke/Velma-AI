# Fowlp Warpage And Reliability

Analyze warpage of the reconstructed wafer and packaged unit, and define the reliability qualification plan.

## Inputs

- `rdl-routing`: Completed RDL design
- `process-flow`: Process flow defining material stackup

## Outputs

- `warpage-analysis`: Predicted warpage at room temperature and reflow, with mitigation strategy
- `reliability-plan`: JEDEC qualification test plan with expected results based on design analysis

## Process

1. Model warpage sources: CTE mismatch between silicon die (2.6 ppm/C), mold compound (8-15 ppm/C), and RDL metals/dielectrics. The mold compound dominates for large fan-out area.
2. Select mold compound properties to minimize warpage: low CTE (close to silicon), high filler content, balanced modulus. Some designs use mold compound on both sides of the die for symmetry.
3. Simulate warpage vs temperature profile during reflow. Peak warpage at reflow temperature must allow solder joint formation. Room temperature warpage affects board-level coplanarity.
4. Define reliability qualification per JEDEC JESD47: temperature cycling (condition B: -55 to 125C, 1000 cycles minimum), HAST (130C, 85% RH, 96-168 hours), moisture sensitivity (MSL determination per J-STD-020).
5. Board-level reliability: drop test (JESD22-B111), bend test (JESD22-B113), temperature cycling on board (condition G: -40 to 125C). Fan-out packages are sensitive to board flex due to low package stiffness. Verify solder joint integrity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
