# Lidar Point Classification

Classify each point as ground, vegetation, building, water, noise, or other categories.

## Inputs

- `registered-point-cloud`: Merged and aligned point cloud
- `classification-scheme`: ASPRS class codes or custom classes for the project

## Outputs

- `classified-point-cloud`: Point cloud with class labels assigned to every point
- `classification-statistics`: Point count and percentage in each class

## Process

1. Run ground classification using progressive morphological filtering or cloth simulation
2. Classify above-ground points into vegetation height strata (low, medium, high)
3. Identify building footprints from planar surface detection in the above-ground points
4. Flag noise points (isolated outliers, low-return artifacts) and unclassified points

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
