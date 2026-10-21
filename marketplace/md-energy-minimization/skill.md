# Md Energy Minimization

Minimize the system energy to remove steric clashes and bad contacts before dynamics.

## Inputs

- `system-topology`: Topology file from the system builder
- `initial-coordinates`: Starting coordinates with solvent and ions

## Outputs

- `minimized-coordinates`: Energy-minimized structure with no steric clashes
- `minimization-log`: Energy convergence trace showing steps and final potential energy

## Process

1. Run steepest descent minimization until the maximum force drops below the threshold
2. Switch to conjugate gradient minimization for fine convergence
3. Check that the final energy is reasonable and no atoms have extreme velocities
4. Write the minimized coordinates for the equilibration step

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
