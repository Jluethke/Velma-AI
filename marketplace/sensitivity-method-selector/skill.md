# Sensitivity Method Selector

Choose the sensitivity analysis method based on the number of parameters, computational cost, and whether interactions matter.

## Inputs

- `parameter-catalog`: Full list of model parameters
- `computational-budget`: Maximum number of model evaluations feasible

## Outputs

- `selected-sa-method`: Chosen method (OAT, Morris, Sobol, FAST, or PAWN) with justification
- `sample-design`: Number of samples, sampling scheme, and expected model runs

## Process

1. Estimate the number of model runs each candidate method requires.
2. Assess whether parameter interactions are expected or important.
3. Select the method that fits within the computational budget while answering the question.
4. Design the sampling scheme (Latin hypercube, Saltelli, or Morris trajectories).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
