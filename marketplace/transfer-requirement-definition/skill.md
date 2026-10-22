# Transfer Requirement Definition

Define the initial and target orbits, time and mass constraints, and the available delta-v budget for a transfer.

## Inputs

- `initial_orbit`: Starting orbit: semi-major axis, eccentricity, inclination, and radius at burn points.
- `target_orbit`: Desired final orbit geometry and any phasing or arrival-time needs.
- `mission_constraints`: Transfer-time limit, spacecraft wet mass, and propulsion type available.

## Outputs

- `transfer_requirements`: Consolidated transfer problem: radii, inclinations, time window, and thrust class.
- `delta_v_budget_available`: Delta-v the propulsion system can supply from the usable propellant mass.

## Process

1. Record the initial and target orbit radii r1 and r2 and the circular speeds v = sqrt(mu/r), using Earth gravitational parameter mu = 398600 km^3/s^2 (Sun mu = 1.327e11 km^3/s^2 for heliocentric transfers).
2. Note the plane change required as the inclination difference di between the two orbits.
3. Classify the propulsion as high-thrust impulsive (chemical, burns short relative to orbit period) or low-thrust continuous (electric, burns over many revolutions), since this sets which transfer family applies.
4. Convert usable propellant mass to an available delta-v with the rocket equation dv = g0 * Isp * ln(m0/mf), g0 = 9.80665 m/s^2, to bound what any candidate transfer may cost.
5. State the transfer-time limit; a tight schedule rules out multi-month low-thrust spirals, while an open schedule lets electric propulsion trade time for propellant.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
