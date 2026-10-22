# Fea Mesh Convergence Study

Establish that the FEA result is independent of mesh density through systematic refinement and error quantification.

## Inputs

- `element-selection`: Element types and formulations
- `component-description`: Geometry with identified stress concentrations and load paths

## Outputs

- `converged-mesh`: Mesh that produces results within the specified tolerance of the grid-converged solution
- `mesh-convergence-report`: Results vs mesh density plot, Richardson extrapolation estimate, and GCI confidence interval

## Process

1. Identify critical regions where mesh density matters most: stress concentrations (fillets, holes, notches), contact zones, load application points, and material transitions. These regions need local refinement.
2. Build at least three meshes with systematically increasing density. The refinement ratio should be at least 1.5x in each direction (element size ratio). A factor of 2x is standard. Keep the mesh topology similar (same element types and quality) across refinement levels.
3. Run the same analysis on all three meshes. Extract the quantity of interest (peak stress, max displacement, natural frequency) at the same location on each mesh.
4. Apply Richardson extrapolation: if results on meshes with sizes h1, h2, h3 give values f1, f2, f3, compute the order of convergence p = ln((f3-f2)/(f2-f1)) / ln(r) where r is the refinement ratio. The grid-converged estimate is f_exact = f1 + (f1-f2)/(r^p - 1). The GCI gives a 95% confidence interval.
5. For singularities (re-entrant corners, point loads, crack tips): stress does not converge with mesh refinement at the singularity. Use stress linearization (membrane + bending) through the section, or extract stress at a distance from the singularity, or use fracture mechanics (stress intensity factor converges even though stress does not).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
