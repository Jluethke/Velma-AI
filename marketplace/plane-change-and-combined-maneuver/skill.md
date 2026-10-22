# Plane Change And Combined Maneuver

Size inclination-change cost and fold the plane change into the apoapsis burn to cut delta-v.

## Inputs

- `transfer_requirements`: Inclination difference and orbit speeds.
- `hohmann_solution`: Burn speeds at periapsis and apoapsis to combine the plane change with.

## Outputs

- `plane_change_strategy`: Where to place the inclination change to minimize delta-v.
- `combined_burn_delta_v`: Delta-v for the combined plane-change-plus-altitude burn.

## Process

1. Pure plane change delta-v = 2 * v * sin(di/2); the cost scales with the orbital speed v at the burn point.
2. Because v is lowest at apoapsis, perform the inclination change at the highest-altitude burn: a 28.5 deg change at geostationary speed (3.07 km/s) costs 1.51 km/s, versus 3.57 km/s if attempted in low orbit at 7.73 km/s.
3. Combine the plane change with the circularization burn using the law of cosines: dv = sqrt(v1^2 + v2^2 - 2*v1*v2*cos(di)), which is less than doing the two burns separately.
4. Worked case: geostationary insertion from a 28.5 deg transfer orbit folds the plane change into the apogee burn, saving on the order of 1 km/s over sequential burns.
5. Split the plane change between the two burns only when a detailed optimization shows a small gain; most of the change belongs at apoapsis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
