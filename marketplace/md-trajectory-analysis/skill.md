# Md Trajectory Analysis

Analyze the production trajectory for structural, dynamic, and thermodynamic properties.

## Inputs

- `trajectory-file`: Production trajectory
- `system-topology`: Topology for atom selection and grouping
- `simulation-goal`: Which analyses to prioritize

## Outputs

- `structural-metrics`: RMSD, RMSF, radius of gyration, secondary structure content over time
- `interaction-analysis`: Hydrogen bonds, salt bridges, contact maps, and binding free energy estimates
- `dynamic-properties`: Diffusion coefficients, correlation functions, and relaxation times

## Process

1. Compute RMSD and RMSF relative to the starting or average structure
2. Analyze hydrogen bonds, salt bridges, and hydrophobic contacts over time
3. Calculate radial distribution functions for solvent and ion interactions
4. Extract dynamic properties: mean square displacement, autocorrelation functions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
