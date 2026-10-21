# Gravity Forward Model

Build a forward model of subsurface density structures and compute their predicted gravity response for comparison with the observed anomaly.

## Inputs

- `residual-anomaly`: Residual gravity anomaly highlighting shallow targets
- `geological-constraints`: Known geology, drill holes, seismic sections, or density measurements

## Outputs

- `forward-model-geometry`: 3D geometry of modeled density bodies
- `predicted-anomaly`: Gravity anomaly predicted by the forward model

## Process

1. Define initial body geometries using geological constraints (known contacts, faults, intrusions)
2. Assign density contrasts to each body based on rock property measurements or literature values
3. Compute the gravity response of each body and sum to produce the predicted anomaly
4. Compare predicted vs observed anomaly to identify where the model needs adjustment

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
