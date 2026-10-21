# Data Aggregation Pipeline

Aggregate validated citizen science data into analysis-ready datasets with spatial and temporal summaries.

## Inputs

- `validated-dataset`: Quality-controlled citizen science observations
- `spatial-grid`: Grid cells, administrative boundaries, or habitat polygons for spatial aggregation
- `temporal-bins`: Time intervals for aggregation (daily, weekly, seasonal, annual)

## Outputs

- `aggregated-data`: Spatially and temporally binned summary statistics
- `effort-correction`: Observation counts normalized by sampling effort per grid cell and time period
- `metadata-record`: Dataset documentation following metadata standards (EML, Dublin Core)

## Process

1. Assign each observation to its spatial grid cell and temporal bin
2. Calculate summary statistics (count, mean, proportion) per cell per time period
3. Estimate and correct for sampling effort bias across the study domain
4. Flag cells with insufficient observations for reliable estimates
5. Generate metadata documentation for the aggregated dataset

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
