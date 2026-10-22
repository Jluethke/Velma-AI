# Plane Current Density Analysis

Analyze current distribution in power and ground planes to identify current crowding, verify copper can handle the thermal load, and check for return current discontinuities.

## Inputs

- `pdn-impedance-curve`: Verified PDN impedance performance
- `supply-voltage`: Supply voltage for power calculation
- `transient-current`: Maximum current for thermal analysis
- `stackup-cross-section`: Copper weights and plane geometries

## Outputs

- `current-density-map`: Current density distribution across power and ground planes showing hot spots
- `thermal-rise-estimate`: Temperature rise at the highest current density point using IPC-2152 methodology
- `return-path-discontinuities`: Locations where return current is forced to detour around plane splits, slots, or voids, with the additional loop inductance this creates

## Process

1. Identify the current flow path from the VRM output to the IC power pins. Current does not spread uniformly across the plane; it concentrates in the direct path and crowds around obstacles (via fields, plane cuts, connectors).
2. Calculate current density at the narrowest point (neck-down). Use J = I / (w * t) where w is the effective current path width and t is the copper thickness. For 1 oz copper (35 um), carrying 10A through a 5mm neck-down gives J = 10 / (5e-3 * 35e-6) = 57 A/mm^2.
3. Apply IPC-2152 for temperature rise. The old IPC-2221 charts are for external traces only and are conservative for internal planes. IPC-2152 accounts for copper weight, board thickness, plane area, and ambient temperature. A 10 degree C rise is a common design limit for internal planes.
4. Check return current paths for all high-speed signals. The return current for a signal on layer N flows on the nearest reference plane. If that plane has a split or slot, the return current must detour around it, increasing loop inductance and creating EMI. Map every split and slot, identify which signals cross them, and quantify the additional inductance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
