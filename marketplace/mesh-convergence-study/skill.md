# Mesh Convergence Study

Perform a systematic mesh convergence study to ensure simulation results are independent of mesh density, distinguishing real physics from numerical artifacts.

## Inputs

- `solver-selection`: Chosen solver and approach
- `model-simplification-plan`: Geometry simplifications

## Outputs

- `converged-mesh-settings`: Mesh density settings that produce results within 1% of the asymptotic value, with the convergence plot as evidence
- `mesh-quality-metrics`: Element quality statistics (aspect ratio, skewness, orthogonal quality) confirming the mesh meets solver requirements

## Process

1. Start with a coarse mesh and solve. Record the peak temperature at each critical component. Double the mesh density (halve element size) and solve again. Record temperatures at the same locations.
2. Continue doubling until the temperature change between successive meshes is less than 1% of the temperature rise above ambient. Typically 3-4 mesh levels are needed. Plot element count vs temperature to see the convergence curve.
3. Use Richardson extrapolation to estimate the grid-independent solution: T_exact is approximately (T_fine * r^p - T_coarse) / (r^p - 1) where r is the refinement ratio and p is the observed order of convergence from three mesh levels.
4. Check mesh quality metrics. For CFD: wall y+ should match your turbulence model requirements (y+ less than 1 for SST k-omega, 30-300 for standard wall functions). For FEA: element aspect ratio below 5:1, maximum skewness below 0.9.
5. Apply local mesh refinement at high-gradient regions (near heat sources, at material interfaces, in thermal boundary layers) rather than globally refining. This reduces solve time while maintaining accuracy where it matters.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
