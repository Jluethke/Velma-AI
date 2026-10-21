# Contextual Layer Overlay

Overlay the interpolated surface with contextual layers (land use, elevation, infrastructure) and extract co-located attributes.

## Inputs

- `interpolated-surface`: Predicted value raster
- `context-layers`: Additional spatial layers for overlay (land use, DEM, boundaries)

## Outputs

- `enriched-surface`: Raster or table with predicted values plus contextual attributes at each cell
- `overlay-summary`: Zonal statistics of predicted values within each contextual category

## Process

1. Align all layers to the same grid and extent.
2. Extract contextual attribute values at each prediction cell.
3. Compute zonal statistics (mean, median, range) within each category.
4. Flag cells where context suggests the prediction may be unreliable.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
