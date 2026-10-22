# Rendezvous Proximity Operations

Design the rendezvous sequence from phasing orbit through approach, proximity operations, and docking using Clohessy-Wiltshire relative motion equations and safety constraints.

## Inputs

- `transfer-options`: Available transfer strategies
- `selected-transfer`: Chosen transfer approach

## Outputs

- `rendezvous-sequence`: Complete burn sequence from phasing through final approach with hold points, delta-v per burn, and timing
- `safety-analysis`: Passive safety assessment at each hold point, abort trajectory capability, collision avoidance

## Process

1. Design the phasing orbit. To close a phase angle of delta_theta, lower (or raise) the orbit by delta_a such that after N orbits, the target phase is zero. The required semi-major axis difference is delta_a = a_target * (1 - ((N*2*pi - delta_theta)/(N*2*pi))^(2/3)).
2. Set up the approach sequence using Clohessy-Wiltshire (Hill's) equations for relative motion. The CW equations describe the linearized motion of the chaser relative to the target in the LVLH frame. In the radial direction: x_ddot - 2*n*z_dot - 3*n^2*x = f_x/m. Along-track: z_ddot + 2*n*x_dot = f_z/m.
3. Define hold points along the approach corridor. Typical sequence: start at -30 km range on the V-bar (velocity vector approach) or R-bar (radial approach), hold at -1 km, -200 m, -30 m, -10 m before final approach. At each hold point, verify passive safety: if the chaser loses thrust, will the natural drift maintain safe separation?
4. Design the final approach and docking. Constrain the approach velocity to decrease linearly with range (e.g., v_approach = 0.1% of range per second below 200 m). Account for sensor accuracy degradation at different ranges (lidar, camera, radar) and ensure control authority exceeds the largest expected dispersions.
5. Plan abort trajectories from each hold point. A retrograde delta-v equal to the current approach velocity plus a safety margin will open the range. Verify that abort from any point in the sequence does not create a collision risk for at least two orbit periods.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
