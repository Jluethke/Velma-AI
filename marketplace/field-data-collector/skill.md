# Field Data Collector

Execute the field sampling: record species identities, abundances, and environmental covariates at each sampling unit.

## Inputs

- `sampling-protocol`: The sampling method and unit specifications
- `effort-allocation`: Number of units and their locations

## Outputs

- `species-abundance-matrix`: Sites-by-species matrix of counts or cover values
- `environmental-data`: Covariates measured at each site (soil, moisture, elevation, canopy cover)

## Process

1. At each sampling unit, identify and count all target species (or estimate cover).
2. Record environmental covariates using standardized protocols.
3. Note sampling conditions (weather, time, observer) for quality control.
4. Enter data into a structured matrix format immediately to catch transcription errors.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
