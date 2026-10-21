# Candidate Model Definer

Define the set of candidate models: their functional form, assumptions, complexity, and the parameters to be estimated.

## Inputs

- `modeling-goal`: What the model needs to predict or explain
- `data-description`: Variable types, sample size, and known data characteristics

## Outputs

- `candidate-list`: Each model with its name, form, assumptions, and complexity
- `comparison-criteria`: The metrics that will be used to compare models

## Process

1. List the candidate models spanning a range of complexity (simple to flexible).
2. For each candidate, state the functional form and the assumptions it makes.
3. Count the effective number of parameters as a complexity measure.
4. Define the comparison metrics: prediction error, information criteria, or domain-specific scores.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
