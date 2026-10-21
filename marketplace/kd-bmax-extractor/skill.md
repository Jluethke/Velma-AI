# Kd Bmax Extractor

Extract equilibrium dissociation constant (Kd) and maximum binding capacity (Bmax) from the best-fit model.

## Inputs

- `fit-results`: Best model parameters with standard errors
- `experiment-metadata`: Protein concentration for Bmax per mg calculation

## Outputs

- `kd-values`: Kd with 95% confidence interval in appropriate units (nM, uM)
- `bmax-values`: Bmax total and per mg protein with confidence intervals

## Process

1. Report Kd from the best-fit model with 95% confidence intervals
2. Convert Bmax from binding units to fmol/mg or pmol/mg protein using the protein concentration
3. Verify that Kd falls within the range testable by the ligand concentrations used
4. Compare Kd to published values for the same receptor-ligand pair if available

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
