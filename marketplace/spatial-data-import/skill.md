# Spatial Data Import

Import point-sampled data with coordinates, reproject to a common coordinate system, and assess spatial coverage.

## Inputs

- `sample-data-file`: CSV, shapefile, or GeoJSON with coordinates and measured values
- `study-area-boundary`: Polygon defining the area to interpolate within

## Outputs

- `projected-point-dataset`: Point data in a consistent projected coordinate system
- `coverage-assessment`: Map of sample density and gaps in coverage

## Process

1. Read the input data and parse coordinates and attribute values.
2. Reproject all points to a common projected coordinate system (UTM or state plane).
3. Clip points to the study area boundary.
4. Map sample density and identify areas with sparse coverage that will have higher interpolation uncertainty.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
