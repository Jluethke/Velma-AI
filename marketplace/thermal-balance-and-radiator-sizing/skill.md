# Thermal Balance And Radiator Sizing

Apply the steady-state energy balance to size radiator area and select surface optical properties.

## Inputs

- `thermal_environment`: External fluxes and eclipse profile.
- `hot_cold_cases`: Load combinations to balance against.
- `temperature_requirements`: Target temperatures that set radiator sink conditions.

## Outputs

- `heat_balance`: Absorbed, internal, and emitted heat for each design case.
- `radiator_area`: Radiator area needed to reject the hot-case heat load.
- `surface_property_selection`: Coating choices by solar absorptance and infrared emittance.

## Process

1. Write the steady-state balance Q_absorbed + Q_internal = Q_emitted, with Q_emitted = emittance * sigma * A * T^4 and sigma = 5.67e-8 W/m^2/K^4.
2. Absorbed load Q_absorbed = absorptance * (solar + albedo) * A + emittance * EarthIR * A.
3. Size the radiator from the hot case: A = Q / (emittance * sigma * (T_radiator^4 - T_sink^4)); rejecting 300 W at 20 C (293 K) to a 3 K deep-space sink needs about 0.73 m^2.
4. Prefer surfaces with a low absorptance-to-emittance ratio: white paint near absorptance 0.2 and emittance 0.9, optical solar reflectors near 0.1 and 0.8.
5. Account for end-of-life absorptance growth from ultraviolet and contamination (white paint can rise from 0.2 to 0.4), which drives the hot-case radiator size.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
