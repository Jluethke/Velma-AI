# Mission Requirements To Orbital Parameters

Translate mission requirements (coverage, revisit time, latency, payload field of view, launch vehicle capacity) into orbital parameter constraints: altitude range, inclination range, eccentricity bounds, and RAAN requirements.

## Inputs

- `mission-objectives`: Coverage area, revisit time, data latency, payload pointing needs, launch mass budget
- `launch-vehicle-constraints`: Fairing diameter, payload mass to orbit by inclination, available launch sites

## Outputs

- `altitude-range`: Acceptable altitude band with rationale (drag vs coverage vs radiation)
- `inclination-constraints`: Required inclination range from coverage geometry and launch site latitude
- `eccentricity-bounds`: Circular vs elliptical trade-off based on dwell time and altitude variation needs

## Process

1. Calculate minimum altitude from atmospheric drag lifetime requirement using ballistic coefficient and solar activity assumptions. Use the Harris-Priester or Jacchia atmospheric model for density at candidate altitudes.
2. Determine inclination from ground coverage requirement. For global coverage, inclination must equal or exceed the latitude of the highest-latitude target. For sun-synchronous orbit, calculate the required inclination from the J2 precession rate equation: dOmega/dt = -3/2 * J2 * (R_e/a)^2 * n * cos(i) and set equal to 360 deg/year.
3. Evaluate orbit regime trade-offs: LEO (200-2000 km) for low latency and high resolution but short contact time; MEO (2000-35786 km) for navigation constellations; GEO (35786 km) for continuous coverage of one hemisphere; HEO (Molniya, Tundra) for high-latitude dwell. Quantify contact time per pass using the Earth central angle and orbit period.
4. Assess radiation environment at each candidate altitude using AP-8/AE-8 trapped particle models or the more recent AP-9/AE-9. Flag the inner Van Allen belt (1000-6000 km) and South Atlantic Anomaly for LEO below 600 km inclinations above 30 degrees.
5. Calculate eclipse fraction as a function of altitude and beta angle. For circular LEO, maximum eclipse fraction is roughly arccos(R_e / (R_e + h)) / pi. Sun-synchronous dawn-dusk orbits minimize eclipse for certain LTAN choices.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
