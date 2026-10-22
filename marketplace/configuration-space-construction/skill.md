# Configuration Space Construction

Build the configuration space representation from the platform geometry and environment, transforming the planning problem from workspace to C-space where the robot is a point.

## Inputs

- `platform-geometry`: Robot dimensions, turning radius, and kinematic constraints
- `environment-representation`: Map or occupancy grid of the operating environment
- `planning-requirements`: Speed range, acceleration limits, and mission objectives

## Outputs

- `c-space-model`: Configuration space representation with obstacle regions, free space, and kinematic constraints encoded
- `constraint-set`: Complete set of constraints: kinematic, dynamic, safety margins, and comfort bounds

## Process

1. Define the configuration space dimensions from the platform kinematics. For a car-like robot: (x, y, theta, velocity) at minimum, optionally steering angle and curvature for smoother planning. For a drone: (x, y, z, yaw) for position planning, full 6-DOF for aggressive maneuvering. For a manipulator: joint angles (N-dimensional C-space). The dimensionality determines which planning algorithms are computationally feasible.
2. Map workspace obstacles into C-space. For a 2D robot with orientation, compute the Minkowski sum of obstacles with the robot footprint at each orientation. For high-dimensional C-space, explicit computation is impractical; instead sample configurations and collision-check each against the environment using the robot's geometric model. Collision checking is the inner-loop bottleneck; use hierarchical bounding volumes (AABB tree, OBB tree) for speed.
3. Encode kinematic constraints. Ackermann-steered vehicles have a minimum turning radius that creates non-holonomic constraints: not all C-space directions are reachable from all configurations. Differential-drive robots are also non-holonomic but can turn in place. Holonomic robots (omnidirectional, drones) can move in any direction from any configuration. The constraint type determines which planners are valid: holonomic systems can use any geometric planner, non-holonomic systems need kinodynamic planners or lattice-based planners with pre-computed motion primitives.
4. Define the constraint set for planning. Kinematic: max velocity, max acceleration, max curvature (from turning radius), max curvature rate (for smooth steering). Dynamic: max lateral acceleration for tire grip, max longitudinal acceleration and braking. Safety: minimum clearance from obstacles (function of speed), minimum time-to-collision threshold. Comfort: max lateral jerk, max longitudinal jerk, max lateral acceleration for passenger comfort (typically 0.2g for normal driving, 0.4g for urgent situations). Document each constraint with its source and rationale.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
