# Enclosure Thermal Strategy

Design the thermal management approach within the enclosure constraints, reconciling the conflict between sealing (which traps heat) and cooling (which requires openings or conduction paths).

## Inputs

- `shielding-design`: EMI shielding approach and aperture treatments
- `sealing-design`: IP sealing design

## Outputs

- `thermal-strategy`: Thermal management approach: natural convection, forced convection with filtered vents, conduction to chassis, heat pipe, or thermoelectric cooler, with thermal resistance budget
- `thermal-interface-specification`: Interface materials and mounting methods for conducting heat from PCB to enclosure walls or heat sinks

## Process

1. For sealed enclosures (IP65+), heat must leave by conduction through the walls or by radiation from the outer surface. Calculate the maximum internal temperature: T_internal = T_ambient + P_total * R_enclosure_to_ambient. For a 200mm x 150mm x 80mm aluminum enclosure dissipating 10W with natural convection on all outer surfaces (h = 8 W/m^2K), R is approximately 5 C/W, giving a 50C internal rise.
2. If internal temperature rise is too high, add conduction paths. Mount high-power components on metal standoffs or thermal bridges that conduct heat directly to the enclosure wall. A 10mm x 10mm copper bar 20mm long conducts heat at R = L/(k*A) = 0.02/(385*0.0001) = 0.52 C/W.
3. For ventilated enclosures, design the airflow path. Inlet at the bottom, outlet at the top for natural convection. For forced convection, place the fan pushing air in (positive pressure prevents dust ingress through gaps). Size the fan for the required airflow: Q = P / (rho * Cp * delta_T) where P is total power and delta_T is the allowed air temperature rise.
4. Size heat sinks for individual high-power components. The heat sink thermal resistance must satisfy: R_heatsink < (T_junction_max - T_ambient) / P_component - R_junction_to_case - R_interface. Use vendor thermal resistance curves at the actual airflow velocity, not the natural-convection rating.
5. Consider heat pipes for point-to-spread thermal problems. A heat pipe with 6mm diameter carries 15-25W and has an effective conductivity 100x that of solid copper. Use when you need to move heat from a concentrated source to a remote heat sink or enclosure surface.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
