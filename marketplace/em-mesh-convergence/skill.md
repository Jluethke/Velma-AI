# Em Mesh Convergence

Perform mesh convergence studies to ensure the simulation result is independent of the mesh density, and the solution is accurate to the required precision.

## Inputs

- `em-model`: The constructed EM model
- `analysis-goals`: Target accuracy for S-parameters, gain, or other quantities

## Outputs

- `converged-mesh`: The mesh settings that produce converged results, with the convergence data showing how the result changed with refinement
- `mesh-convergence-data`: Table of mesh density vs. result (S11, S21, gain, resonant frequency) showing the convergence trend

## Process

1. For FEM (HFSS): use adaptive mesh refinement. Set the convergence criterion to delta_S < 0.01 (maximum change in S-parameter magnitude between consecutive adaptive passes). Run at least 3 adaptive passes after convergence is declared to confirm stability.
2. For FDTD: perform a cell size convergence study. Start with lambda/10 cell size, simulate, then reduce to lambda/15 and lambda/20. Plot the quantity of interest versus cell size. The result should approach a limit as cells get smaller.
3. For MoM: the mesh is on surfaces only. Converge on the edge length of the mesh triangles. Start at lambda/10, refine to lambda/15 and lambda/20 near edges, ports, and discontinuities where current density varies rapidly.
4. In all cases, refine the mesh more aggressively near geometric features: edges, corners, vias, narrow gaps, and slot apertures. These areas have rapidly varying fields or currents and dominate the simulation accuracy.
5. The convergence metric must be the quantity you care about. Converging on S11 at one frequency does not guarantee convergence of S21 at another frequency or the radiation pattern. Check convergence on all quantities of interest.
6. Record the final mesh statistics: number of elements, memory usage, solve time per frequency. This data is needed to estimate simulation time for future similar structures.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
