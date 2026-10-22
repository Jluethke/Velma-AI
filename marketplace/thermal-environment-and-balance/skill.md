# Thermal Environment And Balance

Characterize the orbital thermal environment and establish the energy balance equation for each spacecraft zone, determining the hot and cold design cases.

## Inputs

- `orbit-parameters`: Altitude, inclination, eclipse fraction, beta angle range, mission duration
- `spacecraft-geometry`: External surface areas, orientations, internal component layout and power dissipation

## Outputs

- `thermal-environment`: Solar, albedo, and Earth IR heat fluxes for hot and cold cases
- `energy-balance-model`: Nodal thermal model with boundary conditions for each design case

## Process

1. Define the external heat inputs. Direct solar: q_solar = alpha_s * S * A_projected * cos(theta), where alpha_s is the solar absorptance and S is 1361 W/m^2. Earth albedo: q_albedo = alpha_s * a * S * F * A, where a is the albedo coefficient (0.30 average, varies with cloud and surface), and F is the view factor to Earth. Earth IR: q_IR = epsilon_IR * E * F * A, where E is the Earth IR emission (237 W/m^2 average).
2. Calculate the view factor to Earth from the spacecraft surfaces: F = (R_e/(R_e+h))^2 for a surface facing nadir. For arbitrary orientations, use the projected solid angle of the Earth disk.
3. Define the hot case: minimum altitude (closest to Earth for max albedo and IR), maximum solar constant (perihelion), maximum internal dissipation, worst-case sun angle for the hottest surface. Define the cold case: maximum altitude, minimum solar constant (aphelion), minimum internal dissipation, eclipse entry with worst-case attitude.
4. Build the nodal thermal model. Discretize the spacecraft into thermal nodes (structural panels, electronic boxes, propellant tanks, batteries, payload). Each node has a thermal mass (m*Cp), internal dissipation, radiation coupling to other nodes and to space (sigma*epsilon*A*F), and conduction coupling to adjacent nodes (k*A/L).
5. The steady-state energy balance for each node: Q_solar + Q_albedo + Q_IR + Q_internal + sum(Q_conduction_in) = sigma * epsilon * A_rad * T^4 + sum(Q_conduction_out). For transient cases (eclipse entry/exit), solve the differential equation m*Cp*dT/dt = sum(Q_in) - sum(Q_out).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
