# Aerothermal Environment Characterization

Calculate the heating environment (heat flux, heat load, pressure, shear) on the vehicle during atmospheric entry.

## Inputs

- `entry-trajectory`: Velocity, altitude, and flight path angle vs time during entry
- `vehicle-geometry`: Vehicle outer mold line for aerothermal analysis
- `entry-conditions`: Entry velocity, flight path angle, and atmosphere model

## Outputs

- `stagnation-heating-profile`: Stagnation point heat flux vs time (convective + radiative)
- `surface-heating-map`: Heat flux distribution over the vehicle surface at peak heating
- `total-heat-load`: Integrated heat load (J/m^2) at each location, drives TPS mass

## Process

1. Stagnation point convective heating: use the Sutton-Graves or Fay-Riddell correlation. q_conv = C * sqrt(rho/r_n) * V^3, where rho is atmospheric density, r_n is nose radius, and V is velocity. Heating scales as velocity cubed, so entry velocity dominates. LEO return at 7.8 km/s is moderate; lunar return at 11 km/s is severe.
2. A larger nose radius reduces stagnation heating (factor of 1/sqrt(r_n)) but increases total heat load (longer entry time due to higher drag at a given velocity). This is the fundamental design trade: sharp entry vehicles have high peak heating but low total heat load; blunt vehicles have low peak heating but high total heat load.
3. Boundary layer transition from laminar to turbulent: turbulent heating is 2-5x higher than laminar. Transition depends on Reynolds number, surface roughness, and nose bluntness. For ablative TPS, the receding surface can promote transition. Conservative design assumes turbulent flow over much of the vehicle.
4. Radiative heating: at velocities above 10 km/s, the shocked gas radiates significantly (shock layer reaches 8,000-15,000 K). Radiative heating can equal or exceed convective heating for lunar/Mars return vehicles. Radiation modeling requires detailed spectral analysis of the shocked gas composition.
5. Compute the heat flux distribution over the entire vehicle surface using CFD or engineering correlations (e.g., tangent cone or modified Newtonian for windward surface, Lees for downstream). The lee side has much lower heating but may have complex separated flow regions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
