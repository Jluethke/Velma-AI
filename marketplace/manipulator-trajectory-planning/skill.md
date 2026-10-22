# Manipulator Trajectory Planning

Plan manipulator trajectories in joint space and Cartesian space: generate smooth motion profiles, handle via points, and respect velocity, acceleration, and jerk limits.

## Inputs

- `kinematic-model`: Kinematics including IK solutions
- `dynamic-model`: Dynamic limits (max velocity, acceleration, torque per joint)
- `task-requirements`: Task waypoints, cycle time requirements, and path constraints

## Outputs

- `trajectory-plan`: Time-parameterized trajectory (joint angles or Cartesian pose vs time) with velocity and acceleration profiles
- `cycle-time-analysis`: Achievable cycle time and bottleneck identification

## Process

1. Choose between joint-space and Cartesian-space planning. Joint-space: interpolate between joint configurations, simple and fast, guarantees joint limit compliance, but the end-effector path in Cartesian space is not controlled (may swing unexpectedly). Cartesian-space: specify the end-effector path (e.g., straight line, arc), solve IK at each trajectory point, guarantees a predictable Cartesian path, but may encounter singularities and joint limit issues. Use Cartesian-space for tasks requiring precise paths (welding, painting, machining). Use joint-space for point-to-point moves (pick and place).
2. Generate smooth motion profiles. Trapezoidal velocity profile: accelerate, cruise, decelerate. Simple, time-optimal for a given acceleration limit, but has discontinuous acceleration (jerk is infinite at transitions). S-curve (7-segment) profile: adds jerk-limited transition segments, smoother for mechanical systems and reduces vibration excitation. Polynomial (3rd, 5th, 7th order): fits start and end conditions (position, velocity, acceleration) exactly, higher order gives more smoothness but may oscillate.
3. Handle via points. For a sequence of waypoints, options: stop at each via point (trapezoidal profiles between each pair, easy but slow due to deceleration and re-acceleration), blend through via points (insert circular or polynomial blends near each via point to maintain speed, faster cycle time). For blended via points, the blend radius trades off between path accuracy at the via point and speed. In joint space, blend in each joint independently.
4. Verify the trajectory against all limits. At each time step: check joint positions against joint limits, check joint velocities against motor speed limits, check joint accelerations against torque limits (using the inverse dynamics model), check Cartesian velocity and acceleration against task requirements. If any limit is violated, scale the trajectory time (slower) or modify the path. Compute the cycle time and identify the bottleneck (which joint or which path segment limits the overall speed). Optimize by adjusting via point locations or blend radii to reduce the bottleneck.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
