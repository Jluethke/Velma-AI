# Michaelis Menten Fitter

Fit the Michaelis-Menten equation to the initial velocity data.

## Inputs

- `velocity-data`: Initial velocity vs substrate concentration data

## Outputs

- `km-vmax`: Km and Vmax with standard errors from the nonlinear fit
- `fit-quality`: R-squared, residual plot, and Lineweaver-Burk plot for comparison

## Process

1. Fit the hyperbolic Michaelis-Menten equation by nonlinear least-squares regression
2. Extract Km and Vmax with their standard errors
3. Inspect the residual plot for systematic deviations (substrate inhibition, cooperativity)
4. Generate a Lineweaver-Burk (double reciprocal) plot as a visual check

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
