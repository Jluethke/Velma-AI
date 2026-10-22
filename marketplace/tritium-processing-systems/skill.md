# Tritium Processing Systems

Design the tritium processing plant for isotope separation, purification, storage, and fuel injection loop.

## Inputs

- `blanket-concept`: Blanket breeder and extraction method
- `tritium-breeding-ratio`: Calculated TBR
- `thermal-hydraulic-design`: Blanket coolant and temperature conditions

## Outputs

- `fuel-cycle-design`: Complete tritium processing flowsheet from exhaust to injection
- `isotope-separation-design`: Cryogenic distillation or TCAP column specifications
- `storage-and-delivery`: Tritium storage method and fuel delivery to plasma

## Process

1. Design the plasma exhaust processing: tokamak exhaust contains D, T, He, impurities (C, N, O, W) at sub-atmospheric pressure. First stage: cryocondensation to remove hydrogen isotopes from helium (palladium/silver membrane permeator alternative).
2. Design isotope separation: cryogenic distillation is the reference technology. Cascade of columns separates H2, HD, HT, D2, DT, T2 by vapor pressure difference. Column design: HETP from packing, reflux ratio from McCabe-Thiele, throughput from duty cycle tritium consumption.
3. Alternative: thermal cycling absorption process (TCAP) using palladium on kieselguhr. Hydrogen isotopes absorbed at low temperature, desorbed at high temperature with isotope fractionation. Simpler than distillation but lower throughput.
4. Design tritium storage: metal hydride beds (uranium, ZrCo) provide safe solid-state storage with low equilibrium pressure at room temperature. Heating releases tritium on demand. Inventory tracking by PVT (pressure-volume-temperature) measurement and calorimetry.
5. Close the fuel cycle: purified D-T mixture delivered to gas injection and pellet injection systems. Typical throughput: 100-300 g T/day for a fusion power plant. In-vessel tritium inventory target < 1 kg for safety. Total site inventory target < 2-4 kg.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
