# Cfd Mesh Quality Assessment

Score the cell-level quality of each mesh against skewness, aspect ratio, orthogonality, and growth-rate limits, because convergence theory assumes well-shaped cells and degenerate elements inject error that no refinement removes.

## Inputs

- `grid-family`: The meshes to be quality-checked
- `first-cell-height`: Near-wall sizing that drives local aspect ratio

## Outputs

- `quality-metrics`: Distributions of skewness, orthogonal quality, aspect ratio, and growth rate with the worst-cell values flagged
- `mesh-defect-list`: Locations and cell counts failing quality limits, with the remedy for each (local refinement, smoothing, re-blocking)

## Process

1. Check equiangle skewness, defined as max((theta_max - theta_e)/(180 - theta_e), (theta_e - theta_min)/theta_e) where theta_e is the ideal cell angle. Keep the maximum below 0.85 for the general field and below 0.9 absolute; a single cell above 0.95 can stall or diverge the solver.
2. Check orthogonal quality, the alignment between the face normal and the vector joining adjacent cell centers. Values near 1 are ideal; keep the minimum above 0.1, and above 0.15 near walls where gradients are steep. Low orthogonality forces non-orthogonal correction terms that slow convergence and add diffusion.
3. Check aspect ratio. High aspect ratio (length over width) is acceptable and expected inside the boundary layer, where 100 to 1000 is normal for prism layers aligned with the flow, but high aspect ratio in regions of multidirectional gradients (stagnation, separation) degrades accuracy. Flag cells over aspect ratio 100 that sit outside attached boundary layers.
4. Check volume growth rate between neighboring cells. Keep the ratio under about 1.2 in smooth regions and under 1.3 anywhere; abrupt size jumps act like a numerical interface that reflects and smears gradients. The prism-layer growth rate from the near-wall step feeds directly into this limit.
5. Confirm a positive Jacobian (no inverted or negative-volume cells) on every element; even one inverted cell makes the discretization invalid. Build a defect list that maps each failing metric to a fix: local refinement for size jumps, surface smoothing for skew, and re-blocking or boundary-layer capping for the worst skew clusters near sharp features.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
