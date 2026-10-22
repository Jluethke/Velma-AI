# Ocean Environment Characterization

Characterize the underwater acoustic environment including sound speed profile, bathymetry, bottom properties, and ambient noise.

## Inputs

- `operating-area`: Geographic location, depth, and season for the sonar or acoustic system operation
- `system-frequency`: Operating frequency range of the acoustic system

## Outputs

- `sound-speed-profile`: Sound speed vs depth including thermocline, sound channel axis, and critical depth
- `bottom-properties`: Bottom type, reflection loss, and scattering strength for the operating area
- `ambient-noise-spectrum`: Ambient noise level vs frequency including wind, shipping, and biological contributions

## Process

1. Obtain the sound speed profile from CTD (conductivity-temperature-depth) data or climatological databases (WOA). Sound speed depends on temperature (dominant above thermocline), salinity (minor effect), and pressure (dominant in deep water). Typical range: 1450-1540 m/s.
2. Identify the sound channel structure: surface duct (downward-refracting below mixed layer), deep sound channel (SOFAR axis at sound speed minimum, typically 700-1200 m depth), convergence zone (refracted rays returning to surface at 30-60 km intervals), bottom bounce paths.
3. Characterize the bottom from geoacoustic databases or surveys. Bottom reflection loss depends on grazing angle, frequency, and sediment type. Sand: moderate loss; mud: high loss at low grazing angles, low loss at steep angles; rock: low loss. Hamilton's regressions give sediment sound speed and attenuation from grain size.
4. Estimate ambient noise: use Wenz curves as baseline. Wind-driven noise dominates 500 Hz to 50 kHz (increases ~5 dB per doubling of wind speed). Shipping noise dominates 20-200 Hz in shipping lanes. Biological noise (snapping shrimp, whale calls) can dominate in specific bands and locations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
