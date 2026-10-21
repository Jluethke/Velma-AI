# Pk Model Selection

Select the compartmental PK model structure: one-compartment, two-compartment, or population approach.

## Inputs

- `pk-dataset`: Concentration-time data for visual inspection
- `dosing-records`: Route of administration determines absorption model

## Outputs

- `model-structure`: Selected model: number of compartments, absorption model, elimination model
- `initial-parameter-estimates`: Starting values for model fitting

## Process

1. Inspect the semi-log concentration-time plot: a single straight line suggests one-compartment, a biexponential curve suggests two.
2. For oral dosing, add a first-order absorption compartment with or without lag time.
3. For population PK, define the structural model, then specify random effects for inter-individual variability.
4. Set initial parameter estimates from published values or non-compartmental analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
