# Variable Identifier

List every variable in the experiment and classify each as independent, dependent, or confounding.

## Inputs

- `experiment-description`: What the experiment is testing and how
- `hypothesis-statement`: The specific hypothesis being tested

## Outputs

- `variable-registry`: All variables with their classification and measurement method
- `confound-list`: Identified confounders with their potential effect direction

## Process

1. Extract all quantities, conditions, and factors mentioned in the experiment description.
2. Classify each as independent (manipulated), dependent (measured), or confounding (must be controlled).
3. For each confound, estimate the direction and magnitude of its potential bias.
4. Record the measurement method and units for each variable.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
