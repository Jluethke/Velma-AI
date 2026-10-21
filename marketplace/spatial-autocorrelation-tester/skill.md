# Spatial Autocorrelation Tester

Test whether the observed spatial pattern is clustered, dispersed, or random using Moran's I and local indicators.

## Inputs

- `projected-data`: Point or polygon data with attribute values in the common CRS
- `spatial-weights`: Neighborhood definition (distance band, k-nearest, or contiguity)

## Outputs

- `global-autocorrelation`: Moran's I statistic, expected value, z-score, and p-value
- `local-indicators`: LISA cluster map classifying each observation as HH, LL, HL, LH, or not significant

## Process

1. Construct the spatial weights matrix from the neighborhood definition.
2. Compute global Moran's I and test significance via permutation.
3. Compute local Moran's I (LISA) for each observation.
4. Classify each observation into cluster type and flag significant ones.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
