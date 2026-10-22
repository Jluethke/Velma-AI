# Fea Element And Material Selection

Select element types and material models that match the structural behavior of the component.

## Inputs

- `component-description`: Geometry, loading, material, and the structural response to predict (stress, displacement, buckling, fatigue)
- `analysis-requirements`: Required accuracy, analysis type (static, dynamic, thermal), and computational budget

## Outputs

- `element-selection`: Element types for each region (1D beam, 2D shell, 3D solid), with formulation (linear/quadratic, reduced/full integration)
- `material-model`: Material constitutive model and parameters for each material in the model

## Process

1. Choose element dimensionality from the geometry: thin-walled structures (t/L < 0.1) use shell elements; slender members (cross-section dimensions << length) use beam elements; everything else uses solid elements. Mixed models connect beams to shells to solids using constraint equations at transitions.
2. Choose element order: linear elements (4-node tet, 8-node hex, 4-node quad shell) are stiff and need fine meshes. Quadratic elements (10-node tet, 20-node hex, 8-node quad shell) are more accurate per element but cost more per element. For stress accuracy, quadratic elements are preferred. For explicit dynamics, linear elements with single-point integration are standard.
3. Choose integration: full integration (2x2x2 for linear hex, 3x3x3 for quadratic hex) is accurate but suffers from shear locking in bending-dominated problems with linear elements. Reduced integration (1 point for linear hex, 2x2x2 for quadratic hex) avoids locking but can exhibit hourglass modes (zero-energy deformation). Use hourglass control with reduced integration.
4. Select material model: linear elastic (E, nu) for small strains below yield. Bilinear or multilinear plasticity (yield stress, tangent modulus) for metals beyond yield. Hyperelastic (Mooney-Rivlin, Ogden, Yeoh) for rubbers and polymers at large strains. Viscoelastic (Prony series) for time-dependent polymer response.
5. For composites: use layered shell elements with ply-by-ply definition (material, orientation, thickness). Apply failure criteria (Tsai-Wu, Hashin, Puck) at each ply. Classical laminate theory is adequate for thin laminates; 3D solid elements are needed near free edges and through-thickness stress gradients.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
