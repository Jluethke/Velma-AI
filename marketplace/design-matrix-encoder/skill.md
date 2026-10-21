# Design Matrix Encoder

Encode the factorial design: list factors and levels, build the coded design matrix, and verify the design structure (full or fractional, resolution).

## Inputs

- `factor-definitions`: Each factor with its name, levels, and coded values
- `experimental-results`: Response values for each run in the design

## Outputs

- `design-matrix`: Coded design matrix with factors, interactions, and response columns
- `design-properties`: Number of factors, levels, runs, resolution, and aliasing structure

## Process

1. List all factors with their low (-1) and high (+1) coded levels.
2. Build the full design matrix including all main effects and interactions.
3. If fractional, identify the generators and the aliasing structure.
4. Verify that the response column has the correct number of observations per run.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
