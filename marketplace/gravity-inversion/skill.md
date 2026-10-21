# Gravity Inversion

Invert the gravity anomaly to recover subsurface density distribution, refining the forward model geometry to match observations within data uncertainty.

## Inputs

- `residual-anomaly`: Observed residual gravity anomaly
- `forward-model-geometry`: Initial model geometry from forward modeling

## Outputs

- `inverted-density-model`: Subsurface density distribution that fits the observed anomaly
- `misfit-report`: RMS misfit between observed and modeled anomaly, with residual map

## Process

1. Set up the inversion mesh and assign initial density values from the forward model
2. Select the inversion algorithm (smooth, compact, or constrained by geological boundaries)
3. Run the inversion, iterating until the data misfit reaches the target threshold
4. Evaluate the result for geological plausibility and quantify non-uniqueness

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
