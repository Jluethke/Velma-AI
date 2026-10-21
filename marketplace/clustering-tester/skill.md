# Clustering Tester

Test for spatial clustering: Ripley's K function, nearest-neighbor index, or quadrat test to determine if the pattern departs from randomness.

## Inputs

- `projected-dataset`: Spatially referenced observations
- `spatial-summary`: Basic spatial statistics for context

## Outputs

- `clustering-result`: Test statistic and whether the pattern is clustered, dispersed, or random
- `scale-dependence`: At what spatial scales clustering or dispersion is strongest

## Process

1. Compute Ripley's K function across a range of distances.
2. Compare observed K to the expected K under complete spatial randomness (CSR).
3. Identify the distances at which the pattern most deviates from CSR.
4. Run a significance test using Monte Carlo simulation of CSR envelopes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
