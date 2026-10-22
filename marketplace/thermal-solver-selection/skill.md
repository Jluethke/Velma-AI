# Thermal Solver Selection

Select the appropriate simulation tool and solver type (CFD vs FEA vs analytical) based on the dominant heat transfer mechanism and required accuracy.

## Inputs

- `thermal-resistance-network`: Lumped network and dominant heat paths
- `first-pass-temperatures`: Initial temperature estimates

## Outputs

- `solver-selection`: Chosen simulation approach (CFD, FEA, or hybrid) with justification based on the physics
- `model-simplification-plan`: List of geometry simplifications that are justified for the chosen solver and accuracy target

## Process

1. Use CFD when forced or natural convection dominates the thermal resistance. CFD solves the Navier-Stokes equations for airflow and couples to the energy equation. Required when airflow patterns are not obvious: multiple heat sources creating thermal wakes, flow around obstructions, or recirculation zones.
2. Use FEA when conduction dominates: sealed systems, cold-plate-cooled assemblies, or components thermally connected to a heat spreader. FEA solves the heat equation in solids and applies convection as a boundary condition without solving for airflow.
3. Use a hybrid approach (CFD for flow, mapped to FEA for detailed component modeling) when both matter: forced-air-cooled systems where component-level detail is also needed.
4. Simplify geometry for the chosen solver. For CFD: replace small components with flat heat sources, model copper planes as anisotropic thermal conductivity blocks, omit features smaller than the boundary layer thickness. For FEA: represent PCB stackup as a single layer with effective in-plane and through-plane conductivity.
5. Define the accuracy target. For thermal design verification: plus or minus 5C correlation to measurement is good practice. For safety certification: must demonstrate margin with worst-case assumptions, no tuning allowed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
