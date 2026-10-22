# Proximity Maneuver And Burn Planning

Plan proximity burns with the state-transition matrix and ensure passively safe trajectories.

## Inputs

- `cw_solution`: State-transition solution for targeting.
- `approach_corridor`: Corridor the trajectory must stay inside.
- `hold_points`: Waypoints between which to target.

## Outputs

- `maneuver_sequence`: Ordered burns to move between hold points.
- `delta_v_plan`: Delta-v for each proximity burn.
- `abort_trajectories`: Passively safe and abort paths.

## Process

1. Solve a two-impulse transfer with the state-transition matrix: the first burn is dv1 = (phi_rv inverse) * (target relative position - phi_rr * current position), and the second nulls the arrival velocity.
2. For a controlled V-bar approach use a glideslope with a steady closing rate, braking in steps as range decreases.
3. Design passively safe trajectories so that if a burn is missed the natural drift carries the chaser clear of the target rather than into it.
4. Plan an abort or collision-avoidance maneuver from each hold point that opens range using only a radial or along-track burn.
5. Keep each burn inside the approach corridor and sum the delta-v across the sequence for the propellant budget.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
