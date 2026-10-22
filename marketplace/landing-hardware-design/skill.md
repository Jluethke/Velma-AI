# Landing Hardware Design

Design the landing legs, grid fins, and other hardware needed for controlled descent and landing.

## Inputs

- `stage-mass-estimates`: Landing mass (dry stage + residual propellant)
- `landing-trajectory-profile`: Touchdown velocity and attitude requirements
- `vehicle-geometry`: Stage diameter and height for stability analysis

## Outputs

- `landing-leg-design`: Leg geometry, material, deployment mechanism, and crush core specification
- `grid-fin-design`: Grid fin size, material, and actuation system for aerodynamic steering
- `landing-stability-analysis`: Tip-over analysis for wind, slope, and CG offset

## Process

1. Landing legs must absorb the kinetic energy at touchdown (typically 1-3 m/s vertical, 0-2 m/s horizontal). Energy absorption: crushable aluminum honeycomb in the leg strut. The crush stroke must absorb 0.5 * m * v^2 at a force below the structural limit of the vehicle. Typical stroke: 0.2-0.5 m.
2. Leg geometry: 4 legs gives a square footprint (simple, light, but sensitive to CG offset and slope). Falcon 9 uses 4 legs. More legs improve stability but add mass and mechanism complexity. The footprint radius must be large enough to prevent tip-over under worst-case CG offset and wind. Rule of thumb: footprint radius > 0.5 * vehicle height * tan(max_tilt_angle).
3. Grid fins: lattice-structure aerodynamic surfaces that provide roll, pitch, and yaw control during supersonic and subsonic descent. They work in the wake of the vehicle (fins at the top of a descending stage). Titanium grid fins survive the high heating during reentry without thermal protection. Sized from the required control moment at the worst-case dynamic pressure.
4. Cold gas or hydraulic actuation for grid fins. Falcon 9 initially used hydraulic fluid (limited supply = limited steering time); later switched to electric actuators powered by batteries. The actuator rate and authority must handle the guidance commands through transonic flight where aerodynamic characteristics change rapidly.
5. Deployment sequence: grid fins deploy after stage separation (or remain deployed throughout, as on Falcon 9 Block 5). Landing legs deploy shortly before landing burn ignition. Deployment reliability must be extremely high (legs or fins failing to deploy = loss of vehicle). Redundant mechanisms and positive locking are required.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
