# Sem Equation Translator

Translate the path diagram into a system of structural and measurement equations ready for estimation software.

## Inputs

- `path-diagram`: The specified path diagram with labeled paths
- `model-hypotheses`: Directional hypotheses for each path

## Outputs

- `equation-system`: Structural and measurement equations in matrix notation
- `software-syntax`: Model syntax for the estimation software (lavaan, Mplus, or AMOS)

## Process

1. Write the measurement model equations linking latent variables to their indicators.
2. Write the structural equations linking latent variables to each other.
3. Set scale for each latent variable by fixing one loading or the variance.
4. Export to software syntax with proper constraints and free parameters.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
