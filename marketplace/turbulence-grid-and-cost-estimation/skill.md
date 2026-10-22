# Turbulence Grid And Cost Estimation

Size the grid and estimate the compute cost the chosen approach demands, so the method is confirmed affordable before a single mesh is generated.

## Inputs

- `scale-resolving-method`: The method whose grid requirements must be sized (or the RANS wall treatment)
- `wall-treatment-requirement`: The near-wall y-plus target that sets the first-cell size

## Outputs

- `grid-sizing`: The near-wall and bulk resolution in wall units with an estimated cell count
- `cost-estimate`: The estimated core-hours and turnaround, with a pass or fail against the compute budget

## Process

1. Size the RANS grid from the wall treatment. For wall-resolved RANS place the first cell at y-plus about 1 with 15 or more cells across the boundary layer; for wall functions place the first cell center at 30 <= y-plus <= 300. The total cell count is dominated by the near-wall clustering and the wake refinement, typically millions of cells for a full configuration.
2. Size wall-resolved LES in wall units. The near-wall grid needs streamwise spacing delta_x+ about 50 to 150, wall-normal first spacing delta_y+ about 1, and spanwise spacing delta_z+ about 15 to 40 to resolve the near-wall streaks; this fine spacing over the whole wetted area is what makes wall-resolved LES scale as roughly Re^1.8 in cell count.
3. Size wall-modeled LES and hybrids more coarsely near the wall. With a wall model the first cell can sit in the log layer and the near-wall grid relaxes, cutting the count substantially; for DDES ensure the grid in the separated region is fine enough to resolve the shed eddies and the switch from RANS to LES happens where intended.
4. Estimate time steps and averaging windows for unsteady methods. A scale-resolving run must use a time step with a cell Courant number near or below 1 in the resolved region and must run long enough to gather converged statistics (many flow-through times), so the cost is cells times time steps times flow-throughs, not just cells.
5. Compare the estimate to the budget and decide. Convert cell count and time steps into core-hours and wall-clock turnaround for the available machine; if a wall-resolved LES is unaffordable, step back to wall-modeled LES, DDES, or an unsteady RANS before meshing, rather than discovering the infeasibility after building a grid.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
