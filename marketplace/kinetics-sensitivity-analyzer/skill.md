# Kinetics Sensitivity Analyzer

Determine which rate constants most influence the model output.

## Inputs

- `ode-system`: Rate equations
- `estimated-constants`: Fitted rate constants

## Outputs

- `sensitivity-coefficients`: Normalized sensitivity of each species to each rate constant over time
- `parameter-ranking`: Rate constants ranked by influence on the key observable

## Process

1. Compute local sensitivity coefficients by perturbing each rate constant by a small fraction.
2. Normalize sensitivities to make them comparable across parameters with different magnitudes.
3. Identify the dominant rate constants at early, intermediate, and late times.
4. Highlight parameters that are both influential and poorly constrained.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
