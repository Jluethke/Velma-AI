# Lidar Feature Extraction

Extract measurable features from the point cloud and derived models.

## Inputs

- `classified-point-cloud`: Classified points
- `normalized-height-model`: Height above ground for each point
- `survey-metadata`: Project goals defining which features to extract

## Outputs

- `extracted-features`: Canopy height metrics, building footprints, power line clearances, or other requested features
- `feature-statistics`: Summary statistics for each feature class across the study area

## Process

1. Compute canopy height metrics per plot or grid cell (mean, max, percentiles, cover fraction)
2. Delineate building footprints and estimate roof heights from the classified building points
3. Measure clearance distances between power lines and vegetation where applicable
4. Export features as vector polygons, raster grids, or tabular summaries

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
