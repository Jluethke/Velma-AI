# Archaeological Spatial Analyzer

Analyze the spatial distribution of artifacts and features across the site to identify activity areas and site structure.

## Inputs

- `artifact-catalog`: Artifacts with 3D coordinates and context assignments
- `site-grid`: Site grid and feature plan

## Outputs

- `density-maps`: Kernel density maps of artifact types across the site
- `activity-area-interpretation`: Identified clusters and their functional interpretation

## Process

1. Plot artifact locations in the site grid by type and material
2. Compute density distributions and identify clusters (nearest neighbor, Ripley's K)
3. Relate clusters to features (hearths, pits, walls) for functional interpretation
4. Map activity areas (cooking, tool production, storage, refuse disposal)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
