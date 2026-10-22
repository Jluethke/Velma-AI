# Propellant Mass And Tank Sizing

Apply the rocket equation to get propellant mass, then size tanks and the feed system.

## Inputs

- `delta_v_budget`: Delta-v that sets the required mass ratio.
- `technology_selection`: Specific impulse and propellant type.
- `spacecraft_mass`: Dry mass that anchors the mass ratio.

## Outputs

- `propellant_mass`: Usable propellant mass plus residual and margin.
- `tank_sizing`: Tank volume from propellant density.
- `feed_system`: Pressurization and propellant-management approach.

## Process

1. Propellant mass mp = m0 * (1 - exp(-dv / (g0 * Isp))), with g0 = 9.80665 m/s^2 and m0 the wet mass.
2. Add residuals and loading margin of about 2 to 5 percent so the tanks are not run dry.
3. Size tank volume from density: hydrazine near 1010 kg/m^3, nitrogen tetroxide near 1440 kg/m^3, and xenon stored supercritically near 1500 kg/m^3.
4. Choose pressurization: blowdown (simple, pressure falls as propellant is used) or regulated (constant pressure from a separate gas tank) for steady performance.
5. Add a propellant-management device (surface-tension vanes or a diaphragm) so the feed stays gas-free in free fall.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
