# Rendezvous Phasing And Approach Planning

Plan phasing to the target and define the approach corridor and hold points.

## Inputs

- `chaser_orbit`: Starting orbit of the active spacecraft.
- `target_orbit`: Orbit of the target to be approached.
- `rendezvous_constraints`: Timing, lighting, and safety constraints.

## Outputs

- `phasing_plan`: Sequence of phasing orbits to close the along-track gap.
- `approach_corridor`: Allowed approach cone and axis.
- `hold_points`: Stationkeeping points along the approach.

## Process

1. Close the along-track phase angle with a differential-altitude phasing orbit: a slightly lower orbit has a shorter period and catches up, the rate set by the altitude difference.
2. Transfer to an approach ellipse with Hohmann-like burns, then hand over to close-range relative maneuvering.
3. Choose the approach axis: along the velocity vector (V-bar) or along the radial from the target (R-bar), each with different natural motion and abort behavior.
4. Define an approach corridor cone (for example plus or minus 10 deg) that bounds position error for crew or structure safety.
5. Set hold points (for example 1 km, 250 m, and 30 m) where the chaser stationkeeps to check navigation and systems before proceeding.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
