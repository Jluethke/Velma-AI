# Ccm Dcm Boundary Analysis

Determine the boundary between continuous and discontinuous conduction mode across the load range and decide whether to design for CCM, DCM, or mixed-mode operation.

## Inputs

- `switch-stress-table`: Switch stress for selected topology
- `passive-stress-table`: Passive component stress data

## Outputs

- `inductance-selection`: Selected inductance value with rationale for CCM vs DCM operation, including critical inductance calculation
- `operating-mode-map`: Map showing CCM/DCM regions across input voltage and load current, with transition boundary marked

## Process

1. Calculate critical inductance: Lcrit = D*(1-D)^2 * R / (2*fsw) for buck, Lcrit = D*(1-D)^2 * Vout / (2*fsw*Iout) for boost. At loads below the boundary current, the converter enters DCM.
2. For the selected topology, plot the CCM/DCM boundary across the full input voltage range. At low Vin (high D for buck), the boundary current is lower, meaning CCM is easier to maintain.
3. Decide: if the load range spans more than 10:1 and light-load efficiency matters, consider allowing DCM at light loads with a larger L to keep the boundary below 10-20% of full load. If the load is always above 50% of rated, design firmly in CCM.
4. For DCM operation: recalculate the transfer function. Buck in DCM: Vout/Vin = 2/(1 + sqrt(1 + 8*L*fsw/(D^2*R))). The plant becomes a first-order system with no right-half-plane zero, which simplifies compensation but duty cycle becomes load-dependent.
5. Select the inductance value. Standard practice: L = 1.5 to 3 times Lcrit at full load for reliable CCM. Lower L means higher ripple but faster transient response. Higher L means lower ripple but slower transient and larger physical size.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
