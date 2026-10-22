# Relative Motion Dynamics Cw

Model relative motion with the Clohessy-Wiltshire equations and characterize natural drift.

## Inputs

- `phasing_plan`: Approach stage that sets the relative starting state.
- `target_orbit`: Target orbit that sets the mean motion.

## Outputs

- `relative_dynamics`: Relative equations of motion in the target frame.
- `cw_solution`: State-transition solution for relative position and velocity.
- `natural_motion`: Natural relative orbit and drift behavior.

## Process

1. Work in the target local-vertical-local-horizontal frame with x radial, y along-track, and z cross-track.
2. The Clohessy-Wiltshire equations for close, near-circular relative motion are: x'' - 2n*y' - 3n^2*x = ax; y'' + 2n*x' = ay; z'' + n^2*z = az.
3. Mean motion n = sqrt(mu / a^3) from the target semi-major axis a sets the relative-motion frequency.
4. With no thrust the in-plane motion is a 2-by-1 ellipse (twice as long along-track as radial) that drifts along-track unless the initial along-track rate is nulled.
5. Build the state-transition matrix from these equations to propagate any relative state and to solve targeting burns.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
