# Thruster Configuration And Layout

Lay out thrusters for full control authority, redundancy, and clean plume paths.

## Inputs

- `thrust_requirements`: Control torques and translation needs.
- `technology_selection`: Thruster type and count available.
- `spacecraft_geometry`: Mounting geometry and sensitive surfaces.

## Outputs

- `thruster_layout`: Thruster positions and orientations for six-degree-of-freedom control.
- `redundancy_scheme`: How the layout tolerates a thruster failure.
- `plume_analysis`: Plume impingement avoidance on arrays and radiators.

## Process

1. Place thrusters to give three-axis torque couples and the required translation directions; a couple of opposed thrusters makes pure torque with no net force.
2. Cant thrusters so a remaining set still gives full control after one failure, accepting a cosine loss cos(theta) in effective thrust from the cant angle.
3. Route plumes clear of solar arrays, radiators, and optics, since impingement adds disturbance torque, heating, and contamination.
4. For electric propulsion gimbal the thruster so its line of action passes through the moving center of mass as propellant depletes.
5. Set the thruster count from the need to hold three-axis control plus the main delta-v direction with margin and redundancy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
