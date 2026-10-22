# Laser Thermal Management

Design the thermal management system to remove waste heat from the gain medium, minimize thermal lensing and stress birefringence, and maintain beam quality at operating power.

## Inputs

- `gain-medium-selection`: Crystal or fiber geometry, absorption efficiency, quantum defect, thermal conductivity, dn/dT, thermal expansion coefficient
- `pulse-parameters`: Average power, heat load distribution along the gain medium

## Outputs

- `thermal-design`: Cooling method (conduction to heatsink, liquid cooling, jet impingement), heatsink temperature, predicted temperature rise at center of gain medium, thermal lens focal length, stress-induced birefringence and depolarization loss
- `beam-quality-at-power`: M-squared degradation from thermal effects, power limit before beam quality exceeds specification

## Process

1. Compute the heat load: P_heat = P_pump * (1 - eta_laser) where eta_laser = eta_abs * eta_qd * eta_extraction * eta_mode_overlap. For diode-pumped Nd:YAG, the quantum defect heating is (1 - 808/1064) = 24% of absorbed pump power. Additional heating from upconversion and non-radiative relaxation.
2. For a cylindrical rod, the radial temperature distribution is: T(r) - T_surface = (Q_heat / (4*pi*k)) * (1 - (r/r0)^2) where Q_heat is the volumetric heat density, k is the thermal conductivity, and r0 is the rod radius. The thermal lens focal length: f_thermal = (pi * k * r0^2) / (P_heat * dn/dT * L) for end-pumped geometry.
3. For slab geometry, the temperature gradient is one-dimensional (across the thin dimension). Slab advantage: the thermal lens is cylindrical, correctable with a single cylindrical lens. Compute the OPD variation across the beam due to dn/dT, stress-optic effect, and end-face bulging.
4. For disk (thin-disk) geometry, the heat flow is axial through the thin dimension to the heatsink. The thermal lens is weak (f_thermal >> 10m for typical thin-disk Yb:YAG). But the low single-pass gain requires many passes (24-72 bounces on the disk), making alignment and ASE management the primary challenges.
5. For fiber lasers, the distributed heat load along meters of fiber is removed radially. The temperature rise is small (typically < 50K above coolant for kW-class), but the onset of transverse mode instability (TMI) at high average power limits the single-fiber power. TMI threshold scales approximately as: P_TMI ~ (A_eff * eta_qd) / (g * chi_T * lambda_s) where chi_T is the thermo-optic coefficient.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
