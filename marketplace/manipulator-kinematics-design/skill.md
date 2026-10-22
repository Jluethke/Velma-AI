# Manipulator Kinematics Design

Select the manipulator kinematic chain and solve forward and inverse kinematics: choose DOF, extract DH parameters, analyze workspace, and implement IK solutions.

## Inputs

- `task-requirements`: Workspace volume, payload, reach, dexterity, and speed requirements
- `mounting-constraints`: Where the manipulator can be mounted and how it can reach the workspace

## Outputs

- `kinematic-model`: DH parameters, forward kinematics, inverse kinematics solutions, and workspace analysis
- `manipulator-selection`: Selected manipulator type with DOF, reach, payload, and repeatability specifications

## Process

1. Determine the required degrees of freedom from the task. 3 DOF (x, y, z) for pick-and-place without orientation control. 4 DOF for palletizing (x, y, z, plus wrist rotation). 6 DOF for general manipulation (arbitrary position and orientation in 3D). 7+ DOF for redundant manipulators that can reconfigure around obstacles while maintaining end-effector pose. More DOF increases dexterity but also cost, complexity, and control difficulty.
2. Select the kinematic chain type. Serial (open chain): anthropomorphic (RRR), SCARA (RRP), cylindrical, spherical. Advantages: large workspace relative to footprint, simple kinematics. Disadvantages: cumulative joint errors, lower stiffness. Parallel (closed chain): Delta, Stewart-Gough platform. Advantages: high stiffness, high speed, high accuracy. Disadvantages: small workspace, complex kinematics. Select based on workspace shape, payload, speed, and accuracy requirements.
3. Extract DH parameters and solve forward kinematics. For the selected chain, assign coordinate frames to each joint using the Denavit-Hartenberg convention. The DH parameters (a, alpha, d, theta) fully specify the kinematic geometry. Forward kinematics: multiply homogeneous transformation matrices from base to end-effector to get the end-effector pose as a function of joint angles. Validate against the manufacturer's specifications or a CAD model.
4. Solve inverse kinematics. For 6-DOF serial robots, closed-form analytical solutions exist for common configurations (e.g., robots with a spherical wrist: decouple position and orientation). For non-standard configurations or redundant robots, use numerical methods: Jacobian pseudo-inverse (iterative, may converge to local minimum), optimization-based (formulate as nonlinear least squares with joint limit constraints). For redundant robots, use the null-space to optimize a secondary objective (avoid joint limits, avoid obstacles, minimize effort). Verify the IK solution by running FK on the result and checking the pose error is below the repeatability specification.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
