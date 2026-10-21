# Cfd Geometry Mesher

Define the computational domain geometry and generate the mesh with appropriate resolution for the flow features of interest.

## Inputs

- `geometry-definition`: CAD model or geometric description of the domain
- `flow-conditions`: Expected Reynolds number, Mach number, and key flow features

## Outputs

- `computational-mesh`: Volumetric mesh with boundary layer refinement and quality metrics
- `mesh-quality-report`: Cell count, skewness, aspect ratio, and y+ estimate

## Process

1. Import or construct the geometry and define the fluid domain boundaries
2. Set mesh sizing: global element size, boundary layer inflation, and feature-based refinement
3. Generate the mesh and check quality metrics (skewness < 0.9, aspect ratio < 100)
4. Estimate the wall y+ for the intended turbulence model and adjust if needed

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
