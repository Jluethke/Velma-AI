# Sigmoid Model Selector

Select candidate dose-response models: 4-parameter logistic (4PL), 5-parameter logistic (5PL), or log-logistic, based on the data shape.

## Inputs

- `organized-data`: Cleaned dose-response data
- `prior-knowledge`: Whether the curve is expected to be symmetric, whether bottom/top plateaus are known

## Outputs

- `candidate-models`: List of models to fit, with their parameter definitions
- `initial-guesses`: Starting parameter values for each model derived from the data

## Process

1. Inspect the data for asymmetry (suggesting 5PL over 4PL).
2. Determine whether to fix the bottom asymptote at 0% and the top at 100% or estimate them.
3. List the candidate models with their equations and free parameters.
4. Estimate initial parameter guesses from the data (midpoint for EC50, slope from the steepest segment).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
