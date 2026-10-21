# Flow Quantity Extractor

Extract flow quantities of interest from the converged solution (velocity profiles, pressure distributions, forces, heat transfer).

## Inputs

- `converged-solution`: The converged flow field
- `extraction-plan`: List of quantities, locations, and surfaces to extract

## Outputs

- `extracted-quantities`: Tabulated flow data at the requested locations and surfaces
- `flow-visualizations`: Contour plots, streamlines, and vector fields

## Process

1. Extract line and surface data at the specified locations
2. Compute derived quantities (wall shear stress, heat flux, vorticity)
3. Integrate forces and moments on bodies of interest
4. Generate visualization images (contours, streamlines, isosurfaces)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
