# Lidar Terrain Surface Models

Generate digital terrain model (DTM) and digital surface model (DSM) from classified points.

## Inputs

- `classified-point-cloud`: Point cloud with ground and surface classes assigned

## Outputs

- `digital-terrain-model`: Gridded bare-earth elevation model from ground points
- `digital-surface-model`: Gridded top-of-canopy/structure elevation model from all first returns
- `normalized-height-model`: Height above ground for every point (DSM minus DTM)

## Process

1. Interpolate ground-classified points to a regular grid to create the DTM
2. Interpolate first-return points to create the DSM at the same grid resolution
3. Subtract the DTM from the DSM to produce the normalized height model
4. Fill voids and smooth artifacts at grid boundaries

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
