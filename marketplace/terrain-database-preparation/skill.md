# Terrain Database Preparation

Prepare the terrain database that the navigation system will match against, including resolution requirements, data sources, and compression.

## Inputs

- `mission-area`: Geographic area where terrain navigation must function
- `navigation-accuracy-target`: Required horizontal position accuracy from terrain matching

## Outputs

- `terrain-database`: Formatted terrain elevation database with resolution and accuracy specifications
- `terrain-suitability-map`: Map of terrain roughness showing where terrain navigation will and will not work

## Process

1. Select the data source. SRTM provides 30m (1 arc-second) global coverage with ~6m vertical accuracy. DTED Level 2 provides 30m posting with ~12m LE90 vertical accuracy. Lidar surveys provide 1-5m posting with <0.5m vertical accuracy but limited coverage. For underwater: bathymetric surveys with multibeam sonar.
2. Determine required database resolution. The matching algorithm needs terrain features smaller than the position uncertainty. Rule of thumb: database posting should be 1/3 to 1/5 of the desired position accuracy. For 100m accuracy, 20-30m posting is adequate. For 10m accuracy, 2-5m posting from lidar or high-resolution survey is needed.
3. Compute terrain roughness across the mission area. Roughness metrics: standard deviation of elevation within a moving window, or the Laplacian of the elevation surface. Areas with low roughness (flat plains, open water, uniform slope) are unsuitable for terrain matching. Mark these in the suitability map with a warning threshold.
4. Format the database for onboard storage. Grid the elevation data in a regular lat/lon grid or UTM projection. Apply lossless compression (delta coding + entropy coding can achieve 3:1-5:1 for terrain). For memory-constrained platforms, load only the tiles along the planned flight path plus margin for off-track navigation.
5. Validate the database against independent measurements. Compare database elevations to survey checkpoints not used in the database creation. Report the RMS vertical error and identify any systematic biases that would create a navigation offset.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
