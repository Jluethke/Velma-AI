# Thermal Environment And Requirements

Characterize the orbital thermal environment and define worst hot and cold cases against component temperature limits.

## Inputs

- `orbit_parameters`: Altitude, beta angle, and eclipse fraction that set external heat loads.
- `component_list`: Dissipating units with their power and allowable temperature ranges.
- `mission_phases`: Operating modes and seasons that bound the thermal extremes.

## Outputs

- `thermal_environment`: Solar, albedo, and Earth-infrared fluxes and the eclipse profile.
- `temperature_requirements`: Allowable temperature range for every component.
- `hot_cold_cases`: Worst-hot and worst-cold load combinations to design against.

## Process

1. Set the solar constant at 1361 W/m^2 near 1 AU, Earth albedo fraction 0.3 (range 0.2 to 0.4), and Earth outgoing infrared near 237 W/m^2.
2. Compute eclipse duration from the orbit beta angle; a low-Earth-orbit eclipse lasts up to about 36 minutes and drives the cold case.
3. Define the worst-hot case as summer solstice, end-of-life degraded coatings, full Sun, and maximum internal dissipation.
4. Define the worst-cold case as maximum eclipse, beginning-of-life coatings, and minimum dissipation (for example safe mode).
5. Record component limits such as battery 0 to 30 C, electronics -40 to 85 C, and propellant lines above 10 C to prevent freezing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
