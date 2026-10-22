# Trajectory Smoothing And Constraints

Post-process planned trajectories for smoothness, comfort, and constraint satisfaction: apply trajectory smoothing, enforce jerk limits, and verify the final trajectory against all constraints before execution.

## Inputs

- `dynamic-planning-system`: Planner output including raw trajectory waypoints
- `constraint-set`: Full constraint set including comfort bounds

## Outputs

- `executable-trajectory`: Smooth, constraint-satisfying trajectory ready for the control system
- `constraint-verification-report`: Verification that every constraint is satisfied at every point along the trajectory

## Process

1. Apply trajectory smoothing. If the raw planner output is a sequence of waypoints, fit a smooth curve through them. Common approaches: cubic spline interpolation (C2 continuous, fast), quintic polynomial segments (C4 continuous, controls acceleration and jerk), B-spline (adjustable smoothness, convex hull property for obstacle avoidance). Choose the representation that matches the control system's input requirements. For time-parameterized trajectories, smooth position and then compute velocity and acceleration profiles; do not smooth velocity independently as this can create inconsistencies.
2. Enforce comfort constraints on the smooth trajectory. Check lateral acceleration at every sample point: if it exceeds the comfort limit (typically 2 m/s^2 for normal driving), reduce speed on that segment. Check longitudinal jerk: if it exceeds the limit (typically 1-2 m/s^3), adjust the acceleration profile. Check lateral jerk: if steering changes are too abrupt, increase the transition time. These checks may require iterating between spatial path smoothing and speed profile optimization.
3. Verify all constraints on the final trajectory. Sample the trajectory at the control loop rate (e.g., every 10ms). At each sample: check collision clearance against static and predicted dynamic obstacles, check kinematic feasibility (curvature within turning radius), check dynamic feasibility (acceleration within tire friction limits), check comfort bounds (jerk, lateral acceleration). If any sample violates a constraint, replan with tighter bounds or flag the trajectory as infeasible.
4. Prepare the trajectory for execution. Output format: time-stamped sequence of (x, y, heading, curvature, velocity, acceleration) at the control loop rate. Include the constraint verification status and any reduced-confidence flags (e.g., close clearance to obstacles, high predicted curvature near the kinematic limit). The control system uses this trajectory as its reference, tracking it with a path-following controller.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
