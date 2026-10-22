# Range Safety And Flight Termination

Design the flight termination system and range safety architecture for public protection.

## Inputs

- `trajectory-design`: Nominal trajectory and failure mode trajectories
- `launch-site`: Populated areas and exclusion zones near the flight path
- `vehicle-configuration`: Vehicle characteristics affecting debris dispersion

## Outputs

- `fts-design`: Flight termination system architecture (command destruct, AFTS, or both)
- `destruct-criteria`: Criteria for commanding vehicle destruct (IIP lines, corridor violations)
- `debris-footprint-analysis`: Predicted debris impact area for nominal and failure cases
- `casualty-expectation`: Expected casualties from debris (must be below 30 in a million per mission)

## Process

1. The flight termination system (FTS) is a safety system that destroys the vehicle if it deviates from the planned trajectory and threatens populated areas. Required by the FAA (14 CFR 450) and the Eastern/Western Range. The range safety officer (RSO) or an autonomous system commands termination.
2. Command destruct: ground-based radar tracks the vehicle. If the instantaneous impact point (IIP) crosses a destruct line (boundary protecting populated areas), the RSO commands destruct via encrypted radio link. The vehicle's linear shaped charges (LSCs) cut the propellant tanks, dispersing propellant and ending thrust. Two independent FTS receivers and batteries are required.
3. Autonomous Flight Termination System (AFTS): the vehicle carries its own GPS receiver and pre-loaded trajectory corridor. If the vehicle exits the corridor, the on-board computer commands termination automatically. AFTS eliminates dependence on ground tracking infrastructure and enables launches from sites without full range support. SpaceX, ULA, and others now use AFTS.
4. Debris analysis: model the vehicle breakup (from FTS or failure) and propagate debris trajectories through the atmosphere to impact. Consider aerodynamic drag on each fragment, wind, and fragment mass distribution. The debris footprint is an ellipse oriented along the wind direction, typically 5-20 km long.
5. Casualty expectation (Ec): Ec = sum over all populated areas of (probability of debris reaching area * population density * casualty area per fragment). FAA requires Ec < 30 per million per mission for each individual and collective risk. This analysis drives the destruct corridor boundaries and may restrict launch times based on ship and aircraft traffic.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
