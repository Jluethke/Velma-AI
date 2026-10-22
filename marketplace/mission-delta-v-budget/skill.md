# Mission Delta V Budget

Build the total delta-v budget for a mission from launch to final orbit, accounting for every loss source.

## Inputs

- `target-orbit`: Desired orbit parameters (altitude, inclination, eccentricity)
- `launch-site`: Launch site latitude and longitude (determines free velocity from Earth rotation and achievable inclinations)
- `payload-mass-kg`: Delivered payload mass in kilograms

## Outputs

- `ideal-delta-v`: Ideal (Hohmann or direct) delta-v to target orbit in m/s
- `gravity-loss-estimate`: Gravity loss estimate in m/s from thrust-to-weight ratio and burn time (typically 1000-1500 m/s for LEO)
- `drag-loss-estimate`: Aerodynamic drag loss in m/s (typically 100-400 m/s depending on vehicle shape and trajectory)
- `steering-loss-estimate`: Steering and cosine losses from off-axis thrust in m/s
- `total-delta-v-budget`: Sum of ideal, gravity, drag, and steering losses plus margin

## Process

1. Calculate ideal delta-v from vis-viva equation for the target orbit. For LEO at 200 km, ideal delta-v is about 7,800 m/s. For GTO, add the Hohmann transfer delta-v.
2. Estimate gravity loss: integral of g*sin(theta)*dt over the burn. For a vehicle with initial T/W of 1.3, gravity loss is roughly 1,200-1,500 m/s. Higher T/W reduces gravity loss but increases structural mass and drag.
3. Estimate drag loss from ballistic coefficient and trajectory. A well-designed trajectory through max-Q keeps drag loss to 100-300 m/s. Blunt vehicles or low-altitude staging increase this.
4. Estimate steering loss from the angle between thrust vector and velocity vector during gravity turn. Typically 50-150 m/s. Dog-leg maneuvers for inclination changes add significant steering loss.
5. Add margin (typically 5-10% for a new vehicle, 2-3% for a mature vehicle). The total budget drives every subsequent sizing decision.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
