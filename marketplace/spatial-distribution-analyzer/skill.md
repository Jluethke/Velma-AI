# Spatial Distribution Analyzer

Analyze the spatial distribution of objects: nearest-neighbor distances, clustering, and spatial density maps.

## Inputs

- `morphometry-table`: Object centroids and measurements
- `segmentation-summary`: Context about image area and border exclusions

## Outputs

- `spatial-statistics`: Nearest-neighbor distribution, Clark-Evans index, and density map
- `spatial-pattern`: Classification as clustered, random, or dispersed with statistical test result

## Process

1. Compute the centroid of each object.
2. Calculate nearest-neighbor distances for all objects.
3. Compute the Clark-Evans index (observed/expected NN distance) to test for clustering.
4. Generate a spatial density map (kernel density estimate) showing regions of high and low object density.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
