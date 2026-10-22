# Power Grid Topology Design

Select and size the on-chip power grid topology (mesh, tree, or hybrid) to meet the IR drop target across the die at peak current demand.

## Inputs

- `current-map`: Peak and average current demand by die region, from gate-level power analysis
- `metal-stack`: Available metal layers, sheet resistance per layer, via resistance

## Outputs

- `power-grid-layout`: Power stripe widths, spacings, and routing layers with mesh topology
- `static-ir-drop-map`: IR drop at each point on the die under peak DC current

## Process

1. The IR drop target is typically 5-10% of VDD. At VDD = 0.8V, this is 40-80 mV. This budget covers the entire path from package pin to the transistor's virtual VDD: bond wire (5-20 mV), package trace (5-15 mV), C4 bump (1-5 mV), and on-chip grid (the remainder).
2. Power grid topology: a mesh (orthogonal stripes on alternating metal layers) is the standard approach. Top-level metals (thickest, lowest resistance) carry the bulk current from the C4 bumps. Lower metals distribute locally. Via arrays connect the layers.
3. Size the top-metal stripes: sheet resistance of top metal is typically 10-20 mOhm/sq. For a stripe of width W carrying current I over length L, IR drop = R_sheet * L / W * I. Set W so that the drop for the longest stripe is within budget.
4. Via arrays between power stripes: each via has resistance of 1-5 Ohm. For high-current connections, use arrays of hundreds of vias. The via array resistance = R_via / N_vias. Ensure sufficient vias that the total via resistance is negligible compared to the stripe resistance.
5. Run a static IR drop analysis: apply the peak current map to the power grid RC model. Solve for voltage at every node. Identify hot spots where IR drop exceeds the target. Add wider stripes or additional stripes in those regions.
6. For multi-supply domains: each domain gets its own grid. At domain boundaries, use isolation cells (level shifters) that tolerate the IR-drop-induced voltage difference between domains. Cross-domain coupling through shared substrate requires guard rings at boundaries.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
