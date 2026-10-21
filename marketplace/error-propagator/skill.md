# Error Propagator

Propagate all uncertainties through the calculation: analytical method (partial derivatives) for simple cases, Monte Carlo simulation for complex or non-linear cases.

## Inputs

- `calculation-formula`: The mathematical relationship
- `classified-uncertainties`: All input uncertainties with distributions
- `correlation-notes`: Any correlations between inputs

## Outputs

- `combined-uncertainty`: The total uncertainty on the output quantity
- `sensitivity-coefficients`: How much each input contributes to the output uncertainty

## Process

1. If the function is simple and inputs are approximately normal, use the GUM analytical method (partial derivatives).
2. If the function is non-linear or distributions are non-normal, use Monte Carlo propagation.
3. Include correlations between inputs in either method.
4. Compute the sensitivity coefficient (partial derivative or numerical sensitivity) for each input.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
