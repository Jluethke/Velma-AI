# Radiation Environment And Dose

Characterize the radiation environment and compute total ionizing dose versus shielding.

## Inputs

- `orbit_parameters`: Orbit that sets trapped-particle and solar exposure.
- `mission_lifetime`: Duration over which dose accumulates.
- `shielding_config`: Spacecraft wall and spot-shield thicknesses.

## Outputs

- `radiation_environment`: Trapped, solar, and cosmic particle environment.
- `total_dose`: Total ionizing dose behind the shielding.
- `dose_depth_curve`: Dose as a function of aluminum shield thickness.

## Process

1. Characterize trapped protons and electrons from the belt models, solar energetic-particle events, and the galactic-cosmic-ray background for the orbit.
2. Build the dose-depth curve: total ionizing dose in krad(Si) as a function of aluminum thickness, which falls steeply then flattens.
3. Typical levels: low orbit a few krad per year, geostationary tens of krad behind a few mm of aluminum over several years, and the medium navigation orbit is harsher from the belts.
4. Note diminishing returns in shielding: beyond a few mm of aluminum, electron bremsstrahlung and energetic protons limit the benefit of added mass.
5. Derate electronic parts to the dose at their location, using the dose-depth curve plus any local spot shielding.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
