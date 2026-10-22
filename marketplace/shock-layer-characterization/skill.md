# Shock Layer Characterization

Analyze the shock structure around a hypersonic body: oblique shock angles from theta-beta-Mach relations, bow shock standoff distance estimation, entropy layer thickness and its effect on boundary layer development, and post-shock thermodynamic state including temperature and pressure ratios.

## Inputs

- `vehicle-geometry`: Body shape, nose radius, leading edge sweep, and cross-section profiles
- `flight-conditions`: Mach number, altitude, angle of attack, and freestream conditions (density, temperature, velocity)

## Outputs

- `shock-geometry`: Shock shape, standoff distance, oblique shock angles at key stations
- `post-shock-state`: Temperature, pressure, density, and velocity behind the shock at each station
- `entropy-layer-profile`: Entropy layer thickness and swallowing distance along the body

## Process

1. Calculate freestream conditions from altitude using the 1976 Standard Atmosphere: pressure, density, temperature, speed of sound, dynamic pressure.
2. For the nose region, estimate bow shock standoff distance from the Billig correlation (delta/R = 0.143 * exp(3.24/M^2) for a sphere).
3. At each body station downstream, apply oblique shock relations: tan(theta) = 2*cot(beta)*[(M1^2*sin^2(beta)-1)/(M1^2*(gamma+cos(2*beta))+2)] to find shock angle beta from body deflection angle theta.
4. Calculate post-shock thermodynamic state using normal shock relations applied to the Mach number component normal to the shock (Mn = M*sin(beta)).
5. Identify the entropy layer: the region of high-entropy gas processed by the strong bow shock that gets swallowed into the boundary layer downstream. Estimate the swallowing distance using the relation x_sw/R ~ (Re_inf * R)^0.5 where the entropy layer merges with the boundary layer edge.
6. Flag stations where post-shock temperatures exceed 2000K, indicating real gas effects will modify the shock structure from ideal gas predictions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
