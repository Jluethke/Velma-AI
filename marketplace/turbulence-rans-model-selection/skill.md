# Turbulence Rans Model Selection

Choose a RANS closure when the averaged flow suffices, matching the model to wall-bounded versus free-shear behavior and to the presence of separation.

## Inputs

- `flow-regime-profile`: The regime features that steer the closure choice
- `modeling-requirements`: The physics the averaged model must capture

## Outputs

- `rans-closure`: The selected RANS turbulence model with its applicability and limits
- `wall-treatment-requirement`: Whether the model integrates to the wall (y-plus about 1) or uses wall functions (y-plus 30 to 300)

## Process

1. Use the standard k-epsilon model for high-Reynolds, free-shear and fully turbulent core flows. It is stable and cheap and performs well for jets, mixing layers, and flows without strong wall effects, but it is inaccurate in the near-wall region and under adverse pressure gradients, and it normally runs with wall functions (y-plus 30 to 300) rather than integrating to the wall.
2. Use the k-omega SST model as the default for wall-bounded aerodynamic and separating flows. It blends a k-omega formulation near the wall (integrating to the wall at y-plus about 1) with k-epsilon behavior in the far field, and its shear-stress-transport limiter improves the prediction of separation onset under adverse pressure gradients, which is why it is the common first choice for external aerodynamics and turbomachinery.
3. Consider a Reynolds-stress model when anisotropy dominates. Flows with strong swirl, rotation, or secondary motions in ducts have anisotropic turbulence that eddy-viscosity models (k-epsilon, k-omega) cannot represent; a Reynolds-stress model solves transport equations for the individual stresses at higher cost and lower stability, justified only when the anisotropy drives the result.
4. Add a transition model when the screening flagged transition. Couple the turbulence model with a transition formulation (for example a gamma or gamma-Re-theta model) so the laminar run and transition location are predicted rather than assumed fully turbulent from the leading edge.
5. Accept the shared limitation of all RANS closures. They model the entire turbulence spectrum and assume a separation of scales between the mean and the turbulence, so they predict mean attached flows well but lose accuracy for massively separated, strongly unsteady, or acoustically driven flows, which is the boundary where the next step moves to scale-resolving methods.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
