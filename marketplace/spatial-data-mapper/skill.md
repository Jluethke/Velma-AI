# Spatial Data Mapper

Map the spatial data: project coordinates, define the study region boundary, and compute basic spatial statistics.

## Inputs

- `spatial-dataset`: Observations with coordinates (x,y or lat/lon) and measured values
- `region-definition`: Study area boundary (polygon) and coordinate reference system

## Outputs

- `projected-dataset`: Observations in a projected coordinate system with distances in meters
- `spatial-summary`: Point count, spatial extent, mean nearest-neighbor distance, and intensity

## Process

1. Project the coordinates to a local metric CRS if they are in geographic (lat/lon).
2. Clip observations to the study region boundary.
3. Compute basic spatial statistics: intensity (points per area), mean nearest-neighbor distance.
4. Produce a map of the study region with observation locations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
