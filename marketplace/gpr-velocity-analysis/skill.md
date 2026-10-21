# Gpr Velocity Analysis

Estimate the subsurface radar wave velocity to convert two-way travel time to depth.

## Inputs

- `processed-radargrams`: Processed GPR profiles
- `calibration-targets`: Known buried objects or layer depths for velocity calibration

## Outputs

- `velocity-model`: Estimated velocity for each material layer or spatially variable velocity field
- `depth-converted-profiles`: GPR profiles converted from time to depth using the velocity model

## Process

1. Analyze hyperbola apexes from point targets to fit velocity using curve matching
2. Cross-reference with known target depths if calibration objects are available
3. Build a layered or spatially variable velocity model
4. Convert all profiles from two-way travel time to depth

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
