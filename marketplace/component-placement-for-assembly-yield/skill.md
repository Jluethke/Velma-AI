# Component Placement For Assembly Yield

Place components to prevent tombstoning, shadowing, and thermal imbalance during reflow, following the actual physics of solder surface tension.

## Inputs

- `board-outline`: Board dimensions and keep-out areas
- `component-library`: Component sizes, weights, and pad geometries
- `assembly-process`: Reflow profile direction and wave solder direction if applicable

## Outputs

- `placement-rules`: Spacing rules: component-to-component, component-to-edge, orientation relative to reflow conveyor direction
- `tombstone-prevention-measures`: Specific measures for each passive size (0402, 0201, etc.): pad symmetry, thermal relief, trace routing approach direction
- `thermal-balance-check`: Verification that both pads of each passive component are thermally balanced (similar copper connection) to prevent one side wetting before the other

## Process

1. Orient passives perpendicular to the reflow conveyor direction so both pads enter the peak temperature zone simultaneously. If one pad reaches reflow temperature before the other, the molten solder pulls that side flat while the other side is still solid, standing the component up (tombstoning).
2. Check thermal balance for every passive component: if one pad connects to a large copper pour or plane and the other connects to a thin trace, the large-copper pad heats slower and wets later. Mitigate with thermal relief on the large-copper pad (narrow spoke connections to the plane, allowing the pad to heat independently). For 0201 and smaller, both pads must have nearly identical copper connections.
3. Set component-to-component spacing based on assembly method: 0.5 mm minimum for reflow-only (to prevent solder bridging during placement inaccuracy), 1.0 mm minimum near wave-solder components (solder wave can bridge closer components), 2.5 mm minimum for hand rework access (if rework is anticipated).
4. Avoid shadowing in wave solder: tall components block the solder wave from reaching shorter components behind them. Orient tall components parallel to the wave direction (long axis along the direction of travel). Place small components at least 2 mm upstream of tall components. For mixed SMT/through-hole boards, keep SMT components on the primary (reflow) side and through-hole on the wave side when possible.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
