# Attitude Control System Design

Design the attitude control system for stability and maneuvering during all flight phases.

## Inputs

- `vehicle-geometry`: Vehicle dimensions, mass properties, and CG travel during flight
- `tvc-method`: Thrust vector control capability (gimbal range, rate, bandwidth)
- `guidance-algorithm`: Guidance commands that the control system must follow

## Outputs

- `control-law-design`: Controller architecture, gains, and stability margins for each flight phase
- `structural-filter-design`: Filters to prevent control-structure interaction with vehicle bending modes
- `rcs-design`: Reaction control system sizing for coast, roll control, and fine pointing

## Process

1. The rigid-body control loop: PID or PD controller for each axis (pitch, yaw, roll). The plant is a double integrator (angular acceleration to angle). The loop gain must be high enough for trajectory tracking and disturbance rejection, but low enough to avoid exciting structural bending modes.
2. Bending mode filtering: the first bending mode frequency of a launch vehicle is typically 2-8 Hz. If the control loop gain at the bending mode frequency is too high, the controller will excite the bending mode (causing oscillation and potential structural failure). A notch filter at the bending frequency, or low-pass filter below the bending frequency, prevents this.
3. Slosh: propellant sloshing in partially filled tanks acts like a pendulum mass and can couple with the control system. Slosh frequency depends on tank diameter and fill level (f = sqrt(g * tanh(pi*h/D) / (pi*D)) for the first mode). Slosh baffles reduce the slosh amplitude; the control loop must be designed to not excite slosh.
4. Gain scheduling: the vehicle dynamics change dramatically during flight. Mass decreases (T/W increases), CG moves, aerodynamic properties change with Mach number, and bending mode frequencies change with propellant level. The controller gains must be scheduled (varied with flight condition) to maintain stability margins throughout.
5. RCS sizing: during coast phases (between stages, or during orbital maneuvering), main engine TVC is unavailable. Reaction control thrusters provide attitude control. Size the thrusters from the worst-case disturbance torque (residual rates after staging) and the pointing accuracy requirement. Typical RCS thrust: 100-5000 N per thruster.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
