# Cell Balancing Design

Design the cell balancing system to equalize state of charge across series-connected cells, choosing between passive (dissipative) and active (energy-transfer) balancing based on mismatch magnitude and efficiency requirements.

## Inputs

- `cell-model`: Cell equivalent circuit model with OCV-SOC curves
- `operating-limits`: Cell voltage and current limits

## Outputs

- `balancing-method`: Selected balancing approach (passive resistive, active capacitor shuttle, active inductor, or transformer-based) with rationale based on mismatch magnitude and application
- `balancing-circuit-design`: Circuit schematic: balancing resistor value and MOSFET switch for passive, or inductor/capacitor and switching topology for active, with control thresholds and balancing current

## Process

1. Assess the mismatch magnitude. New cells from the same batch typically mismatch by 1-3% SOC. After aging, mismatch can grow to 5-10% as cells degrade at different rates. The balancing system must correct this mismatch within a reasonable time (typically during charging, over 1-4 hours).
2. Passive (dissipative) balancing: a resistor and MOSFET switch across each cell. The BMS turns on the switch for the highest-voltage cell(s) to discharge them through the resistor until all cells are equalized. Balancing current: Ibal = Vcell / Rbal. Typical: 50-200mA. Time to balance 5% SOC mismatch on a 3Ah cell: delta_Q = 0.05 * 3Ah = 150mAh. At 100mA: 1.5 hours. Dissipation: Pbal = Vcell * Ibal = 3.6V * 100mA = 360mW per cell.
3. Active balancing: transfers energy from high cells to low cells instead of dissipating it. Capacitor shuttle: a capacitor switches between adjacent cells, transferring charge from higher to lower. Inductor-based: uses a small inductor to move energy between cells with a boost/buck converter per cell pair. Transformer-based: a multi-winding transformer allows any-cell-to-any-cell transfer.
4. Selection criteria: for small packs (under 16 cells) with small mismatch: passive is preferred for its simplicity and low cost ($0.10-0.50 per cell in components). For large packs (EV, grid storage) or where energy efficiency matters: active balancing recovers the energy and can balance faster with higher currents. The added complexity and cost ($2-5 per cell) must be justified by the application.
5. Design the control algorithm. For passive: turn on the balancing MOSFET when the cell voltage exceeds the average by more than a threshold (typically 10-20mV). Turn off when equalized within 5mV. For active: run the transfer when any cell pair has more than 20mV difference. Stop when within 5mV. Log the balancing activity as a health indicator (increasing imbalance suggests a weak cell).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
