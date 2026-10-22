# Fea Boundary Condition Definition

Apply constraints and loads that represent the real support stiffness without over-constraining or leaving rigid-body modes, because boundary conditions set the answer more than the mesh does.

## Inputs

- `model-idealization`: The dimensional model that the loads and supports attach to
- `part-and-loading`: Service loads, support interfaces, and symmetry

## Outputs

- `constraint-set`: The applied supports, symmetry planes, and coupling/connector definitions with their stiffness assumptions
- `load-set`: The applied loads as pressures, tractions, or distributed forces, with point loads avoided where possible

## Process

1. Remove all six rigid-body modes without adding spurious stiffness. In 3D the model needs exactly enough constraint to prevent translation and rotation; under-constraint leaves a singular stiffness matrix and the solver fails or returns garbage, while over-constraint invents support reactions that did not exist and depresses stress.
2. Represent real support compliance rather than idealized clamps. A bolted flange is not fully fixed; use a bolt-preload connector or a spring representing joint stiffness. A fully fixed face at a stress-critical location creates an artificial stress concentration; move the constraint away from the region of interest or use a softer, more realistic representation.
3. Use symmetry only when geometry, material, loads, and expected response are all symmetric. Apply symmetry boundary conditions (zero normal displacement, zero in-plane rotation on the cut plane) to cut cost. Never use symmetry for buckling or modal analysis, which have antisymmetric modes that a symmetric model cannot see.
4. Spread loads as pressures or surface tractions, not point forces. A concentrated force on a solid mesh creates a stress singularity at the node that refines to infinity; distribute it over its true contact patch, or use a coupling or distributing constraint that spreads the load to a set of nodes with a controlled stiffness.
5. Check the free-body balance before trusting anything. The sum of support reactions must equal the applied load to within solver tolerance (better than 0.1 percent); a mismatch means a load or constraint is wrong. Inspect the deformed shape at a large scale factor to confirm the part moves the way physical intuition expects.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
