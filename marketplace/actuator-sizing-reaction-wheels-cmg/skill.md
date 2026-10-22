# Actuator Sizing Reaction Wheels Cmg

Size reaction wheels for slew and momentum storage, and assess control-moment gyros for agile pointing.

## Inputs

- `disturbance_torques`: Torques the actuators must counter.
- `momentum_accumulation`: Cyclic momentum the wheels must store.
- `pointing_budget`: Slew-rate and settling requirements.

## Outputs

- `wheel_sizing`: Reaction-wheel torque and momentum capacity and array geometry.
- `cmg_option`: Control-moment-gyro assessment for high-agility missions.
- `control_authority`: Available control torque and momentum headroom.

## Process

1. Size slew torque from a rest-to-rest maneuver: T = 4 * theta * I / t_slew^2 for a bang-bang profile over angle theta in time t_slew.
2. Size wheel momentum to absorb the cyclic disturbance over an orbit: stored momentum H is on the order of T_disturbance * (orbit period) / 4.
3. Typical small-satellite wheels provide 0.01 to 1 Nm of torque and 0.1 to 20 Nms of storage; mount four wheels in a pyramid so any three give full three-axis control with one failed.
4. Control-moment gyros amplify torque by gimbaling a spinning rotor and give the high torque needed for agile imaging slews, at the cost of singularity avoidance in the steering law.
5. Keep a momentum margin so wheels stay off their saturation speed during the worst cyclic orbit, and size the array for the maneuver plus disturbance together.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
