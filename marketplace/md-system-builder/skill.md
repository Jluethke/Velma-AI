# Md System Builder

Build the simulation system from molecular coordinates, topology, and force field selection.

## Inputs

- `molecule-structure`: PDB, MOL2, or XYZ coordinate file for the target molecule or system
- `simulation-goal`: What property or behavior the simulation should investigate
- `solvent-conditions`: Solvent type, ionic strength, pH, and box dimensions

## Outputs

- `system-topology`: Complete topology file with atom types, bonds, angles, and dihedrals
- `force-field-selection`: Chosen force field and parameter justification
- `initial-coordinates`: Solvated and ionized system coordinates ready for minimization

## Process

1. Parse the input structure and assign atom types from the chosen force field
2. Solvate the system in a periodic box with the specified solvent and add counterions
3. Validate that all parameters are assigned and no missing terms exist
4. Write the topology and coordinate files in the simulation engine's format

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
