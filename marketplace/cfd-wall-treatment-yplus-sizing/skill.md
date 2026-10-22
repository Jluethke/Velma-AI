# Cfd Wall Treatment Yplus Sizing

Size the first cell height off every solid wall to the dimensionless distance y-plus that the chosen turbulence wall treatment requires, because a mesh that violates its wall model gives a confidently wrong answer at any density.

## Inputs

- `grid-family`: The refined meshes needing near-wall layer sizing
- `geometry-and-flow-conditions`: Velocity, density, viscosity, and reference length for wall-shear estimation

## Outputs

- `first-cell-height`: The wall-normal size of the first cell for each wall treatment option, in physical units
- `wall-treatment-choice`: Whether the mesh resolves the viscous sublayer (y-plus about 1) or uses wall functions (y-plus 30 to 300)

## Process

1. Define the wall coordinate y-plus = rho*u_tau*y/mu, where u_tau = sqrt(tau_w/rho) is the friction velocity and y is the distance to the first cell center. The wall treatment dictates the y-plus you must hit, and the first cell height is what you control to get there.
2. Choose the wall treatment first. Wall-resolved integration to the wall needs y-plus about 1 (first cell inside the viscous sublayer, y-plus < 5, ideally near 1) and is required for accurate separation and heat transfer. Wall functions bridge the near-wall region and need the first cell center in the log layer, 30 <= y-plus <= 300, which saves cells but assumes an attached equilibrium boundary layer.
3. Estimate wall shear before meshing. For a flat-plate turbulent boundary layer the skin-friction coefficient is Cf = 0.058*Re_x^(-0.2); then tau_w = 0.5*Cf*rho*U^2 and u_tau = sqrt(tau_w/rho). Invert the y-plus definition to get the target first cell height y = y_plus_target*mu/(rho*u_tau).
4. Worked number: air at U = 30 m/s, L = 1 m, rho = 1.2 kg/m^3, mu = 1.8e-5 Pa*s gives Re_L about 2.0e6, Cf about 0.0037, tau_w about 2.0 Pa, u_tau about 1.3 m/s. For y-plus = 1 the first cell height is roughly 1.2e-5 m (12 microns); for wall functions at y-plus = 50 it is roughly 6e-4 m.
5. Set the prism-layer stack to carry the boundary layer, not just the first cell. Use a growth rate of 1.1 to 1.2 between layers and enough layers that the prism-to-tet transition sits outside the boundary layer (10 to 20 wall units thick is a start; aim to place 15 or more cells across the boundary-layer thickness).
6. Verify y-plus from the solution, not the mesh. Compute the actual y-plus field after the first converged run and re-mesh if large patches fall in the buffer layer (5 < y-plus < 30), where neither sublayer resolution nor wall functions are valid and errors are largest.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
