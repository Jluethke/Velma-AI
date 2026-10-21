# Coordinate Projector

Import spatial data, assign or verify the coordinate reference system, and project to a common CRS for analysis.

## Inputs

- `spatial-data-files`: Shapefiles, GeoJSON, CSV with lat/lon, or raster files
- `target-crs`: Target coordinate reference system (EPSG code)

## Outputs

- `projected-data`: All layers in the common CRS
- `projection-log`: Original CRS, transformations applied, and any datum shift warnings

## Process

1. Read each spatial data source and identify its native CRS.
2. Reproject all layers to the target CRS.
3. Check for datum shift issues and log any warnings.
4. Verify that projected coordinates fall within the expected study area bounds.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
