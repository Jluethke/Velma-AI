# Fea Stress Singularity Treatment

Distinguish a true stress concentration from a numerical singularity and handle the singularity with fillet geometry, submodeling, or stress linearization, so refinement is not chasing an infinite value.

## Inputs

- `converged-mesh`: The mesh whose peak stress is under scrutiny
- `convergence-record`: The refinement history that reveals a non-converging local stress

## Outputs

- `singularity-classification`: Whether each hot spot is a real concentration (converges) or a modeling singularity (diverges with refinement)
- `linearized-or-submodel-stress`: The usable stress at each singular feature from stress linearization or a geometrically corrected submodel

## Process

1. Diagnose the singularity by its refinement signature. At a sharp reentrant corner the linear-elastic stress behaves like r^(lambda-1) as the distance r to the corner goes to zero, with lambda < 1, so the peak stress climbs without bound as the mesh shrinks. A stress that rises by roughly a constant percentage at each halving of element size is singular; a stress that flattens to an asymptote is a real concentration.
2. List the usual singularity sources: sharp reentrant corners (zero fillet radius), point loads and point supports, and corners of bonded or tied interfaces where materials with different stiffness meet. Each is an artifact of the idealization, not a physical infinite stress.
3. For sharp corners that are physically rounded, add the real fillet radius and re-mesh. The true stress is finite and set by the radius; a fillet of radius equal to a few percent of the local dimension, meshed with 3 or more quadratic elements across the arc, recovers a converging peak stress.
4. For pressure-vessel and weld assessment where the geometry is genuinely sharp, use stress linearization across the section per the ASME Section VIII Division 2 approach: integrate the through-thickness stress into a membrane component (average) and a bending component (linear), and assess those against category limits instead of the singular peak. The membrane plus bending stress is finite and mesh-independent even when the surface peak is not.
5. For local detail near a singular feature on a large model, build a submodel: cut a small region, drive its cut boundaries with displacements interpolated from the global solution, and mesh it finely with corrected geometry. This resolves the local field at reasonable cost while keeping the global model coarse, and it forces you to supply the real radius that removes the singularity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
