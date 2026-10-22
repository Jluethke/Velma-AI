# Thermal Dissipation Inventory

Catalog every heat source on the board or in the system with its power dissipation under each operating mode, building the thermal source map that drives all downstream analysis.

## Inputs

- `system-description`: Physical description of the electronic system including PCB, components, and enclosure
- `operating-modes`: List of operating modes (idle, typical, peak, fault) with duty cycles

## Outputs

- `heat-source-map`: Table of every component with its power dissipation per operating mode, package thermal resistance, and physical location
- `total-system-dissipation`: Aggregate power dissipation per mode with identification of dominant heat sources (top 20% producing 80% of heat)

## Process

1. Extract power dissipation for each component from datasheets at worst-case supply voltage and maximum ambient temperature. Use Pdiss = Vcc_max * Icc_max for ICs, I^2 * Rds_on * duty for MOSFETs, I^2 * ESR for capacitors, and I^2 * R_dc for inductors.
2. Map each component to its physical location on the board using pick-and-place coordinates or assembly drawing.
3. Calculate power for each operating mode using mode-specific duty cycles. A processor at 3W active and 50mW sleep with 40% active duty dissipates 1.2W + 0.03W = 1.23W average.
4. Rank components by dissipation. Identify the top 20% of power dissipators. These set your thermal design challenge.
5. Record the package thermal resistance values from datasheets: theta_JA (junction to ambient), theta_JC (junction to case), and theta_JB (junction to board). Note which values are missing and will need estimation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
