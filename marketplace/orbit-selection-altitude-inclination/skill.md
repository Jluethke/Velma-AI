# Orbit Selection Altitude Inclination

Trade altitude and inclination for coverage footprint, latency, launch cost, and radiation.

## Inputs

- `coverage_requirements`: Coverage type and area.
- `revisit_targets`: Gap and revisit limits.

## Outputs

- `orbit_selection`: Low, medium, or geostationary orbit regime.
- `altitude_inclination_choice`: Chosen altitude and inclination with rationale.

## Process

1. Compute the coverage footprint half-angle from altitude h and elevation mask el: lambda = acos((Re/(Re+h)) * cos(el)) - el, with Earth radius Re = 6378 km.
2. Higher altitude gives a larger footprint and fewer satellites but adds latency, free-space loss, and launch energy.
3. Avoid the Van Allen belts (intense trapped radiation roughly 1500 to 6000 km and again near 13000 to 20000 km) by placing the orbit below or within protected windows such as the global-navigation band near 20000 km.
4. Set inclination at or above the maximum latitude to be served; use near-polar orbits for global coverage and sun-synchronous orbits for consistent lighting on imaging missions.
5. Trade the regimes: low orbit for low latency and high resolution with many satellites, medium orbit for navigation, geostationary for fixed regional coverage with three satellites.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
