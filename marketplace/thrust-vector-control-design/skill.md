# Thrust Vector Control Design

Design the thrust vector control system to provide pitch, yaw, and roll authority during powered flight.

## Inputs

- `thrust-requirement-n`: Engine thrust level
- `nozzle-contour`: Nozzle geometry for gimbal envelope determination
- `stage-mass-estimates`: Vehicle mass and CG location for moment arm calculation

## Outputs

- `tvc-method`: Selected TVC method (gimbal, secondary injection, movable nozzle) with authority range
- `gimbal-angle-requirement`: Required gimbal angle in degrees for pitch and yaw control
- `actuator-specification`: Actuator type, force, rate, and bandwidth requirements
- `roll-control-method`: Roll control approach (differential gimbal, reaction control, engine-out differential)

## Process

1. Gimbaled nozzle is the standard for liquid engines. The entire thrust chamber and nozzle pivot about a gimbal bearing (ball joint or flexure). Typical gimbal range is 5-8 degrees, which provides adequate control authority for CG offset, wind disturbances, and engine-out cases on multi-engine stages.
2. Gimbal actuator sizing: the actuator must overcome the nozzle side force (thrust * sin(gimbal angle)), the inertia of the nozzle (angular acceleration), and friction/stiffness of flexible propellant lines and the gimbal bearing. Electromechanical actuators are replacing hydraulic for simplicity and reusability.
3. For a single-engine upper stage, gimbaling provides pitch and yaw but no roll authority. Roll control requires either a separate reaction control system (small thrusters), or differential throttle on multiple engines. Vernier engines (small steering engines) were used historically (Atlas, Saturn).
4. The gimbal rate requirement comes from the vehicle control bandwidth needed to reject wind gusts and maintain trajectory. Typical requirement is 5-15 degrees/second at the nozzle. The control system bandwidth is constrained by structural flexibility (bending modes) and sloshing propellant.
5. For solid motors, the nozzle is gimbaled using a flex seal (flexible bearing made of alternating rubber and metal shims). Alternatively, secondary injection (injecting fluid into the nozzle to create a side force) provides TVC without moving the nozzle. Jet vanes (in the exhaust) work but erode quickly.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
