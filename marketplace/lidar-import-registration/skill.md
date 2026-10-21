# Lidar Import Registration

Import raw lidar data and register multiple scans into a common coordinate system.

## Inputs

- `raw-lidar-files`: LAS/LAZ files from the lidar sensor or data provider
- `survey-metadata`: Coordinate reference system, flight lines, and GPS/IMU data

## Outputs

- `registered-point-cloud`: Merged point cloud in the project coordinate system
- `registration-quality`: RMS alignment error and overlap statistics between scans

## Process

1. Import each scan and verify the point count, extent, and return types
2. Transform all scans to the project coordinate reference system
3. Register overlapping scans using ICP or tie-point alignment and record the residuals
4. Merge into a single point cloud and remove duplicate points in overlap zones

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
