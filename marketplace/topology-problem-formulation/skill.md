# Topology Problem Formulation

Define the optimization problem: design domain, loads, constraints, and manufacturing constraints.

## Inputs

- `design-envelope`: Maximum allowable geometry (bounding box), non-design regions (bolt holes, interfaces), loads, and supports
- `performance-targets`: Compliance (stiffness), stress, displacement, or natural frequency targets, plus weight reduction goal

## Outputs

- `optimization-setup`: Design domain mesh, load cases, constraint functions, and manufacturing constraints (symmetry, draw direction, minimum feature size)
- `objective-and-constraints`: Formal optimization statement: minimize weight subject to compliance <= target, or minimize compliance subject to volume <= fraction

## Process

1. Define the design domain: fill the maximum allowable envelope with a finite element mesh. Mark regions that must remain solid (interfaces, bolt holes) and regions that must remain void (clearance volumes). The optimization will distribute material in the remaining design domain.
2. Choose the formulation: minimize compliance (maximize stiffness) for a given volume fraction is the most common and most stable formulation. Minimize volume subject to stress constraints is more directly useful but more difficult numerically because stress constraints are local (one per element) creating a huge number of constraints.
3. Specify all load cases: static loads, thermal loads, gravity, preloads. Multiple load cases are handled as a weighted sum of compliances. The weights determine the relative importance of each load case. Dominant load cases should have higher weights.
4. Add manufacturing constraints: symmetry planes enforce symmetry in the result. Draw direction constraint (extrusion constraint) ensures the result can be extracted from a mold. Minimum member size prevents features thinner than the manufacturing process can produce. Maximum member size prevents thick sections that cause porosity in casting.
5. Choose the element density method (SIMP: Solid Isotropic Material with Penalization). The penalization exponent p (typically 3) drives intermediate densities toward 0 or 1, producing a clear solid/void result. A filter radius (1.5x to 2x element size) prevents checkerboard patterns.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
