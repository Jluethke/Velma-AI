# Momentum Management Desaturation

Design momentum unloading with magnetorquers or thrusters to remove secular buildup.

## Inputs

- `momentum_accumulation`: Secular momentum that must be shed.
- `disturbance_torques`: Secular torque driving the buildup.
- `wheel_sizing`: Wheel storage that sets the unloading cadence.

## Outputs

- `desaturation_strategy`: When and how to unload wheel momentum.
- `magnetorquer_sizing`: Magnetic dipole needed for low-orbit unloading.
- `thruster_unload_budget`: Propellant for unloading where the field is weak.

## Process

1. Secular solar or aerodynamic torque drives steady momentum buildup that saturates the wheels and must be removed on a regular cadence.
2. Magnetic unloading torque T = m x B, with the low-orbit field B near 25 to 45 microtesla; size the dipole m so the per-orbit magnetic impulse exceeds the accumulated momentum.
3. Magnetorquers cannot produce torque about the field direction, so spread unloading over an orbit as the field geometry rotates.
4. At geostationary altitude the field is too weak for torquers, so unload with thrusters: budget the propellant from the momentum to be shed divided by the thruster moment arm and specific impulse.
5. Set the desaturation frequency from the storage margin: unload before wheels reach their speed limit, typically once to a few times per orbit in low orbit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
