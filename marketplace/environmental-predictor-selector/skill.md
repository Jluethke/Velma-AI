# Environmental Predictor Selector

Select and prepare environmental predictor layers for the niche model.

## Inputs

- `clean-occurrences`: Filtered occurrence records
- `study-extent`: Geographic bounds for the analysis

## Outputs

- `predictor-stack`: Set of environmental raster layers aligned and clipped to the study extent
- `collinearity-report`: Pairwise correlations and VIF values, with variables removed if collinear

## Process

1. Assemble candidate environmental layers (climate, topography, land cover, soil)
2. Clip and resample all layers to a common resolution and extent
3. Compute pairwise correlations and variance inflation factors
4. Remove collinear variables, retaining those with the strongest ecological rationale

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
