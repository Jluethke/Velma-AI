# Magnetic Body Modeling

Build forward and inverse models of subsurface magnetic bodies that fit the observed anomaly within data uncertainty.

## Inputs

- `rtp-anomaly`: Observed RTP anomaly for model comparison
- `depth-estimates`: Depth constraints from Euler and Werner methods
- `geological-context`: Known geology and rock property data

## Outputs

- `magnetic-model`: Geometry and susceptibility of modeled magnetic bodies
- `model-fit-report`: Observed vs modeled anomaly profiles with misfit statistics

## Process

1. Define initial body geometries using depth estimates and geological constraints
2. Assign susceptibility values from rock property measurements or literature
3. Forward-model and adjust geometry to minimize misfit along key profiles
4. Run a 3D inversion if profile modeling is insufficient

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
