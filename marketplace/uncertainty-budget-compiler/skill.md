# Uncertainty Budget Compiler

Compile the full uncertainty budget: a table showing each input, its uncertainty, sensitivity coefficient, contribution, and the combined result.

## Inputs

- `measurement-table`: Input measurements
- `sensitivity-coefficients`: Sensitivity of output to each input
- `combined-uncertainty`: Total output uncertainty

## Outputs

- `uncertainty-budget`: Structured budget table per GUM format
- `expanded-uncertainty`: Combined uncertainty multiplied by coverage factor for stated confidence level

## Process

1. Build the budget table with columns: quantity, value, standard uncertainty, sensitivity coefficient, contribution to variance.
2. Sum the variance contributions and take the square root for combined standard uncertainty.
3. Apply the coverage factor (k=2 for ~95% confidence) to get expanded uncertainty.
4. State the result as: value +/- expanded uncertainty with the coverage probability.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
