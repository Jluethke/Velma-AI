# Cfd Grid Family Generation

Generate at least three systematically refined meshes with a constant refinement ratio so that the discretization error can be fit to a power law rather than guessed from two arbitrary grids.

## Inputs

- `target-quantity`: The scalar quantity of interest to be tracked across grids
- `convergence-tolerance`: Allowed grid-induced uncertainty band

## Outputs

- `grid-family`: Three or more meshes (coarse, medium, fine) with recorded cell counts and representative cell size h for each
- `refinement-ratio`: The constant ratio r = h_coarse/h_fine applied between successive grids, with r at least 1.3

## Process

1. Build three meshes minimum. Two grids can only give a difference, not an order of accuracy; three let you solve for the observed order p and detect whether you are in the asymptotic range. Four grids are better when the observed order is uncertain.
2. Refine in every direction together by a constant ratio. Define the representative cell size h = (V_domain/N_cells)^(1/3) for 3D (use 1/2 power for 2D). Keep the grid refinement ratio r = h_coarse/h_fine constant between levels, with r >= 1.3 so the change in h is large enough to separate signal from noise.
3. A uniform global refinement by r = 2 in each direction multiplies cell count by 8 in 3D, so budget memory and run time accordingly. When 8x is unaffordable, use r = 1.5 (about 3.4x cells) but never drop below 1.3.
4. Preserve topology and relative spacing across the family. The boundary-layer growth rate, the surface-to-volume size transition, and the refinement regions must scale uniformly; if only part of the mesh refines, the observed order p becomes meaningless because different regions converge at different rates.
5. Run all three meshes at the identical operating point and discretization scheme (same flux limiter, same turbulence model, same wall treatment). Record cell count and h for each. Changing the scheme between grids confounds spatial error with scheme error and invalidates the extrapolation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
