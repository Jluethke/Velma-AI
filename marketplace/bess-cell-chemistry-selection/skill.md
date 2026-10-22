# Bess Cell Chemistry Selection

Select battery cell chemistry and form factor by matching application requirements to electrochemical trade-offs in energy density, cycle life, safety, and cost.

## Inputs

- `application-requirements`: Power rating (MW), energy capacity (MWh), duration, cycle count target, operating temperature range, and safety constraints
- `project-constraints`: Space envelope, weight limits, budget targets, supply chain preferences, and regulatory requirements

## Outputs

- `cell-selection`: Selected cell with chemistry, form factor, capacity, voltage, cycle life curve, and calendar aging parameters
- `chemistry-trade-off-matrix`: Comparison of candidate chemistries across energy density, cycle life, safety, cost per kWh, temperature range, and supply chain risk

## Process

1. Map the application to a chemistry class. LFP (lithium iron phosphate) for long cycle life (3,000-6,000 cycles to 80% SOH at 1C), superior thermal stability (no thermal runaway below 270C), and lower cost per cycle. NMC (nickel manganese cobalt) for higher energy density (200-270 Wh/kg vs 120-160 Wh/kg for LFP) where space or weight is constrained. Sodium-ion for cost-sensitive, moderate-cycle applications where energy density is less critical.
2. Select form factor. Prismatic cells (50-300Ah) simplify pack assembly and thermal management. Cylindrical cells (21700, 46800) offer better cycle life consistency and easier thermal management per cell but require more complex module assembly. Pouch cells maximize packing density but require external compression for cycle life.
3. Evaluate cell-level specifications. Capacity, nominal voltage, internal resistance (DC-IR), rate capability (continuous and pulse C-rate), and temperature range. Request cycle life data at the expected depth of discharge (DOD) and C-rate, not just the headline 1C/100% DOD number.
4. Assess safety certifications. Cells should pass UN 38.3 for transport, UL 1973 for stationary storage, and IEC 62619. Request abuse test results: nail penetration, overcharge, external short circuit, crush, and thermal abuse at the cell level.
5. Evaluate supply chain. Lead time, minimum order quantity, manufacturing location, and bankability (Tier 1 status from BloombergNEF or equivalent). For large projects, negotiate cell-level warranties including capacity fade guarantees (typically 60-70% of nameplate after stated cycle count) and defect rate limits.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
