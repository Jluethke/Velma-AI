# Em Aware Grid Verification

Verify that all power grid wires and vias meet electromigration lifetime requirements under the actual current distribution from the power analysis.

## Inputs

- `power-grid-layout`: Sized power grid
- `current-map`: Current distribution across the grid from dynamic simulation

## Outputs

- `em-analysis-results`: Current density map with EM violations highlighted
- `em-fixes`: Wire widening and via additions needed to resolve violations

## Process

1. Extract the current through every segment of the power grid from the IR drop simulation. For each segment, calculate the current density J = I / (W * T), where W is the wire width and T is the metal thickness.
2. Compare J to the EM limit for that metal layer. DC (unidirectional) current has the strictest limit. AC (bidirectional) current has a higher limit (typically 2-3x) because the atomic migration partially reverses each half-cycle. Clock networks carry AC current; power grids carry predominantly DC.
3. For vias: each via has a maximum current. If the current through a via array exceeds N * I_max_via, add more vias. For reliability, design for 50% utilization (each via carries at most half its maximum).
4. The EM lifetime depends exponentially on temperature (Black's equation): doubling temperature typically reduces lifetime by 4-8x. Use the worst-case junction temperature for the EM check, not the typical temperature.
5. Fix EM violations by widening the offending wire segment, adding parallel stripes, or increasing the via array size. Re-run the IR drop analysis after changes to ensure the fixes do not create new IR drop hot spots.
6. Sign off: the EM check must pass at the maximum specified junction temperature (typically 125C) for the product lifetime (typically 10 years for consumer, 15-20 years for automotive). Apply appropriate acceleration factors from the EM model.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
