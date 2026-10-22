# Sdm Modal Model Setup

Build the mass and stiffness representation and decide the mass formulation and any degree-of-freedom reduction, because these set the frequencies the eigen-solve will return.

## Inputs

- `structure-definition`: The geometry, material, connections, and support conditions of the structure
- `frequency-range-of-interest`: The upper frequency the analysis must cover, set by the excitation it will see

## Outputs

- `mass-stiffness-model`: The assembled mass and stiffness matrices with the chosen mass formulation and element density
- `reduction-scheme`: Any degree-of-freedom reduction applied and the frequency range it preserves

## Process

1. Set the mesh density from the highest frequency and mode shape of interest, not from a static-stress rule. A mode shape has a spatial wavelength that shrinks at higher frequency; use roughly 6 to 10 elements per half-wavelength of the highest mode you must capture, because a mesh that is fine for stress can be too coarse to represent a high-order mode shape.
2. Choose the mass formulation. A consistent mass matrix, derived from the same shape functions as the stiffness, is more accurate for a given mesh; a lumped (diagonal) mass matrix is cheaper and preferred for explicit transient runs but tends to under-predict frequencies. Note which you use because it shifts the computed frequencies.
3. Represent joints and supports with real stiffness. Bolted and welded joints are not rigid; their compliance lowers natural frequencies, and modeling a joint as fully rigid can push a predicted frequency well above the real one. Where a support is flexible, model it as a spring rather than a fixed boundary.
4. Apply degree-of-freedom reduction when the model is large and only low modes matter. Guyan (static) reduction condenses out the massless or high-frequency degrees of freedom but is accurate only well below the omitted frequencies; component-mode synthesis (for example the Craig-Bampton method) retains a set of fixed-interface modes plus boundary degrees of freedom and preserves accuracy to a stated frequency, which is the method for assembling substructures.
5. State the valid frequency range of the model. Record the highest frequency the mesh and any reduction can represent reliably (often set at the mesh resolution limit or the reduction cutoff), so later steps do not report modes beyond where the model is trustworthy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
