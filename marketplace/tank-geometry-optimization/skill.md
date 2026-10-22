# Tank Geometry Optimization

Optimize tank geometry for volume, mass, and vehicle integration.

## Inputs

- `propellant-volume-required`: Volume of propellant to store, including ullage and residuals
- `vehicle-diameter`: Maximum vehicle diameter constraint
- `propellant-combination`: Oxidizer and fuel types (determines which tank is forward and temperature)

## Outputs

- `tank-dimensions`: Cylinder length, dome shape, and diameter for each tank
- `tank-arrangement`: Tank stacking order (LOX forward or aft) with rationale
- `common-bulkhead-assessment`: Whether a common bulkhead is feasible and its mass savings

## Process

1. Tank volume = propellant volume + ullage (gas space above the liquid, typically 3-5% of tank volume for pressurization gas) + residual (propellant that cannot be consumed, 0.5-2% trapped in feed lines and below the outlet). Add 1-2% for tank biasing to ensure mixture ratio control.
2. Dome shape: sqrt(2):1 ellipsoidal domes are a good compromise between dome mass and cylinder length. The dome contributes significant volume (pi/6 * D^3 for hemispheres). Deeper domes reduce cylinder length but increase dome mass (higher stress for the same pressure). For a given total volume, there is an optimum dome eccentricity.
3. Tank stacking: LOX aft (below fuel) minimizes CG travel during flight (the denser propellant is consumed proportionally with the fuel). LOX forward (above fuel, as on Atlas) places the CG higher, improving structural stability under compression. The choice affects vehicle control dynamics and stability.
4. Common bulkhead: a single dome wall separating LOX and fuel eliminates one dome, the intertank structure, and the associated mass. Saves 5-15% of structural mass. But the temperature difference across the bulkhead is extreme (LOX at 90K, LH2 at 20K = 70K gradient, or LOX at 90K, RP-1 at 293K = 200K gradient). Requires excellent insulation and thermal stress management.
5. For clustered or parallel tank arrangements (side-mounted boosters, in-space stages with multiple small tanks), consider surface-to-volume ratio (spherical tanks minimize this), propellant management (how to drain multiple tanks evenly), and structural load paths.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
