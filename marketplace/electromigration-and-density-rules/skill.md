# Electromigration And Density Rules

Size metal interconnects for electromigration lifetime targets, apply metal density fill rules, and check antenna ratios for gate oxide protection.

## Inputs

- `routed-layout`: Fully routed layout with current estimates per net
- `process-design-rules`: Electromigration current density limits, metal density rules, antenna ratios

## Outputs

- `em-verified-layout`: Layout with wires sized to meet EM lifetime at operating temperature
- `density-and-antenna-clean`: Layout passing metal density and antenna DRC checks

## Process

1. Electromigration current density limit: J_max depends on metal layer (thicker metals carry more), temperature, and target lifetime. From Black's equation: MTTF = A * (J^-n) * exp(Ea / (k*T)), where n is approximately 2 and Ea is 0.7-0.9 eV for Cu. At 105C, typical limits are 1-2 mA/um for thin metals, 5-10 mA/um for thick top metals.
2. For DC current paths (power, bias): wire width must satisfy I_dc / W < J_max_dc. For AC/signal paths with average and RMS currents: use the RMS current density limit (typically 2-3x higher than DC). Clock lines need special attention: high RMS current from driving large loads.
3. Via electromigration: each via has a maximum current. Multiple vias in parallel share current. Use redundant vias on all high-current connections. The recommended via count is I_total / I_max_per_via with at least 2x margin.
4. Metal density rules: each metal layer must have density between the minimum (typically 20-30%) and maximum (typically 70-80%) within each density check window (typically 50-100 um). Insert metal fill patterns (floating or grounded) to meet density. Grounded fill near sensitive analog nets must be carefully placed to avoid additional parasitic capacitance.
5. Antenna rule: during fabrication, metal acts as an antenna collecting charge from plasma etch. The charge-to-gate-area ratio (antenna ratio = metal area / gate oxide area) must not exceed the process limit (typically 200-1000). If exceeded, add antenna diodes at the gate or break the metal connection across layers (jump to a higher metal and back down).
6. Run the full DRC suite: geometry checks, density checks, antenna checks, well proximity effect checks (for advanced nodes). Fix violations iteratively, re-extracting after significant changes to verify that fixes do not create new parasitic issues.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
