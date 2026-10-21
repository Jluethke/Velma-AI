# Sampling Method Selector

Select the sampling method based on the target taxa, habitat, and survey objectives: quadrats for plants, transects for mobile fauna, point-counts for birds.

## Inputs

- `survey-objectives`: Target taxa and ecological questions
- `stratification-plan`: Habitat types and their areas

## Outputs

- `sampling-protocol`: Method, unit size, replication, and spatial layout
- `effort-allocation`: Number of sampling units per stratum

## Process

1. Match the target taxa to the appropriate method: quadrats for sessile organisms, transects for mobile ones.
2. Determine the sampling unit size (quadrat area, transect length) based on organism density and mobility.
3. Calculate the number of units needed per stratum for the desired precision.
4. Lay out the spatial placement: random, systematic, or stratified-random.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
