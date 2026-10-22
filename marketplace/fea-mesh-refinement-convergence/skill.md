# Fea Mesh Refinement Convergence

Refine the mesh in the region of interest until the quantity of interest stops changing, tracking convergence on stress and on strain energy so the reported value is mesh-independent away from singularities.

## Inputs

- `element-selection`: Element family and order used for refinement
- `constraint-set`: Supports held fixed across the refinement study
- `load-set`: Loads held fixed across the refinement study

## Outputs

- `converged-mesh`: The mesh at which the quantity of interest changes by less than the acceptance band under further refinement
- `convergence-record`: The table of quantity of interest versus element size showing the asymptote and the percent change at the accepted mesh

## Process

1. Refine locally where gradients are steep (fillets, holes, section changes) and keep the mesh coarse in low-gradient regions. A uniform fine mesh wastes elements; use at least 3 to 4 quadratic elements through a fillet radius to resolve the surface stress gradient.
2. Run an h-refinement sequence: solve the same model at successively smaller element sizes and plot the quantity of interest (peak von Mises stress or a target deflection) against element size or degrees of freedom. Convergence from above is typical for displacement-based elements because they are too stiff and soften as they refine.
3. Accept the mesh where the quantity of interest changes by less than about 5 percent between successive refinements, measured away from any singular point. Report the converged value and the percent change at acceptance so the reader sees the remaining discretization error.
4. Cross-check with a global energy measure. Total strain energy converges smoothly even when a local stress is noisy; a stable strain energy with a still-climbing local stress is the fingerprint of a singularity, not of a real stress the mesh has yet to resolve.
5. Compute von Mises stress sigma_vm = sqrt(0.5*((s1 - s2)^2 + (s2 - s3)^2 + (s3 - s1)^2)) from the principal stresses for ductile-metal yield assessment, and track that scalar through the refinement rather than a single stress component, which can be mesh-orientation sensitive.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
