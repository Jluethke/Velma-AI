# Mbd System Modeling

Build the multibody system model: bodies, joints, force elements, and degrees of freedom analysis.

## Inputs

- `mechanism-description`: Physical mechanism: bodies (mass, inertia), joints (type, location, orientation), actuators, springs, dampers, and the motion to predict
- `analysis-objectives`: What to predict: kinematics (motion), dynamics (forces and accelerations), or design optimization (parameter study)

## Outputs

- `mbd-model`: Complete multibody model with bodies, joints, force elements, and initial conditions
- `dof-analysis`: Degrees of freedom count (Gruebler/Kutzbach), redundant constraints identification, and expected motion range

## Process

1. Define each body: mass, center of mass location, inertia tensor (about the center of mass in body-fixed coordinates). For rigid bodies, these are the only properties needed. For flexible bodies, include the modal representation (Craig-Bampton modes from FEA) or the full FE mesh.
2. Define joints: revolute (1 rotational DOF), prismatic (1 translational DOF), spherical (3 rotational DOF), cylindrical (1 rotation + 1 translation), planar (2 translations + 1 rotation), fixed (0 DOF, rigid connection). Each joint constrains the relative motion between two bodies.
3. Count degrees of freedom: DOF = 6*N_bodies - N_constraints where each joint type removes a specific number of DOF (revolute removes 5, prismatic removes 5, spherical removes 3, fixed removes 6). If DOF < 0, the system is over-constrained and some joints may need to be replaced with flexible connections or the model corrected.
4. Add force elements: springs (linear or nonlinear stiffness), dampers (linear viscous or velocity-dependent), bushings (combined translational and rotational stiffness/damping), actuators (prescribed force or motion), and contact (normal force from penetration, friction from tangential velocity).
5. Set initial conditions: initial position (joint coordinates or Cartesian), initial velocity, and any preloads. If the mechanism starts from a complex configuration, run an initial position assembly to find a consistent set of positions and velocities that satisfy all joint constraints.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
