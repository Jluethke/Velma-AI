# Fea Idealization And Element Selection

Reduce the real part to the simplest model dimension and element type that still captures the load path, because element order and shape decide whether the mesh converges from above or locks solid.

## Inputs

- `part-and-loading`: Geometry, material, and the loads and supports the part sees in service
- `analysis-goal`: What the analysis must deliver (peak stress, deflection, buckling margin, fatigue life)

## Outputs

- `model-idealization`: The chosen dimensional reduction (beam, shell, axisymmetric, or solid) with the assumptions it imposes
- `element-selection`: Element family and interpolation order with the reason, for example quadratic tetrahedra for a cast bracket

## Process

1. Choose the lowest model dimension that still carries the load path. Use beam elements when one dimension dominates and sections stay plane; shell elements when thickness is under about one tenth of the in-plane size and bending matters; axisymmetric when geometry and load share an axis; solid elements only when thickness effects, contact, or 3D stress states require them. Each reduction cuts cost by orders of magnitude but imposes kinematic assumptions you must honor.
2. Match element order to the quantity of interest. Linear elements give constant strain per element and need many to resolve a gradient; quadratic (second-order) elements give linear strain and resolve bending with far fewer. For stress, prefer quadratic.
3. Avoid linear tetrahedra (the 4-node C3D4) for stress. They are overly stiff and under-predict displacement and stress; they lock in bending and near-incompressible response. Use 10-node quadratic tetrahedra (C3D10) for complex cast or machined geometry, or 8-node hexahedra (C3D8 and its reduced or incompatible-mode variants) for sweepable geometry.
4. Guard against locking modes. Fully integrated linear hexahedra shear-lock in bending; reduced integration risks hourglass zero-energy modes that need hourglass control; near-incompressible materials (rubber, metals in plastic flow, Poisson ratio near 0.5) need hybrid or reduced-integration formulations. Name the formulation, not just the element shape.
5. Write the idealization assumptions down as acceptance conditions. For example, a shell model is valid only while through-thickness stress stays small relative to membrane and bending stress; record the check that will confirm the idealization held once results exist, so the model is falsifiable rather than merely plausible.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
