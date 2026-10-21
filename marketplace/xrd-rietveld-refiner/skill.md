# Xrd Rietveld Refiner

Refine crystal structure parameters and quantify phase fractions using Rietveld whole-pattern fitting.

## Inputs

- `diffractogram`: Standardized two-theta vs intensity data
- `phase-identification`: Matched phases with starting structural models

## Outputs

- `refined-parameters`: Lattice parameters, atomic positions, site occupancies, and thermal factors per phase
- `phase-fractions`: Weight percent of each phase with uncertainty

## Process

1. Load starting structural models for each identified phase
2. Refine instrument parameters (zero shift, sample displacement) followed by structural parameters
3. Monitor Rwp, Rexp, and chi-squared to assess fit quality
4. Extract phase fractions from scale factors and report with uncertainties

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
