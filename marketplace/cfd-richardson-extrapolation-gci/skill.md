# Cfd Richardson Extrapolation Gci

Compute the observed order of accuracy, the Richardson-extrapolated grid-independent value, and the Grid Convergence Index so the discretization uncertainty is reported as a number with an error bar instead of a claim.

## Inputs

- `grid-family`: Three or more meshes with recorded cell size h
- `refinement-ratio`: The constant refinement ratio r between grids
- `target-quantity`: The scalar quantity of interest evaluated on each grid
- `convergence-tolerance`: The acceptance band for grid-induced uncertainty

## Outputs

- `observed-order`: The fitted order of accuracy p from the three grid solutions, compared against the scheme formal order
- `grid-independent-value`: The Richardson-extrapolated estimate of the quantity at zero cell size, f_exact
- `grid-convergence-index`: The GCI uncertainty band on the fine-grid result, with a pass or fail against the tolerance

## Process

1. Order the three solutions f1 (fine), f2 (medium), f3 (coarse) with constant ratio r. Compute the observed order of accuracy p = ln((f3 - f2)/(f2 - f1)) / ln(r). For a nominally second-order scheme expect p near 2; a p far from the formal order signals you are not in the asymptotic range or that limiters and wall models are degrading accuracy.
2. Compute the Richardson-extrapolated value f_exact = f1 + (f1 - f2)/(r^p - 1), the estimate of the quantity as cell size goes to zero. This is the best available truth from the family and the anchor for the error band.
3. Compute the fine-grid Grid Convergence Index GCI_fine = Fs*|(f2 - f1)/f1|/(r^p - 1), using the safety factor Fs = 1.25 when three or more grids are used (use Fs = 3 for only two grids). The GCI is the recommended uncertainty band on the fine-grid solution, expressed as a percent.
4. Confirm the asymptotic range with the ratio GCI_medium/(r^p*GCI_fine); a value near 1.0 (say 0.9 to 1.1) means the grids lie in the asymptotic range and the extrapolation is trustworthy. If it is far from 1, add a finer grid before reporting.
5. Compare GCI_fine to the convergence tolerance. If GCI_fine is within the band, declare the fine (or even medium) mesh grid-independent and report the quantity as f_exact plus or minus GCI. If it exceeds the band, refine further or improve near-wall resolution and repeat, rather than accepting the finest mesh by default.
6. Watch for non-monotonic convergence, where (f3 - f2) and (f2 - f1) have opposite signs. This makes p complex or negative and the GCI formula invalid; it usually means oscillatory grid behavior from an unconverged solve, a y-plus in the buffer layer, or quality defects, each of which must be fixed before the error estimate means anything.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
