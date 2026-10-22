# Surface And Material Effects

Assess atomic-oxygen erosion, ultraviolet darkening, contamination, and charging on surfaces.

## Inputs

- `orbit_parameters`: Orbit that sets atomic-oxygen flux and charging environment.
- `spacecraft_geometry`: Exposed surfaces and their materials.
- `mission_lifetime`: Exposure duration for cumulative effects.

## Outputs

- `ao_erosion`: Atomic-oxygen recession depth on exposed materials.
- `surface_degradation`: Change in optical properties from ultraviolet and contamination.
- `charging_assessment`: Surface and internal charging risk and control.

## Process

1. Estimate the atomic-oxygen fluence in low orbit, on the order of 1e20 to 1e22 atoms/cm^2 over a mission depending on altitude and solar activity.
2. Compute recession depth as fluence times the material erosion yield; polyimide film erodes near 3e-24 cm^3/atom, so unprotected film thins measurably.
3. Protect exposed polymers with coatings such as silicon dioxide or germanium, since atomic oxygen attacks hydrocarbons but not these oxides.
4. Account for ultraviolet darkening and molecular contamination that raise solar absorptance over time and must be carried in the thermal hot case.
5. Assess surface charging (geostationary substorms) and internal charging from energetic electrons; add conductive, grounded surfaces to prevent electrostatic discharge.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
