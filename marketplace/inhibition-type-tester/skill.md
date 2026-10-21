# Inhibition Type Tester

Test for inhibition and determine the inhibition type and Ki.

## Inputs

- `velocity-data`: Initial velocity data with and without inhibitor
- `km-vmax`: Uninhibited Km and Vmax values

## Outputs

- `inhibition-type`: Classification as competitive, uncompetitive, mixed, or noncompetitive
- `ki-value`: Inhibition constant with standard error

## Process

1. Collect velocity data at multiple inhibitor concentrations across the substrate range
2. Fit global models for competitive, uncompetitive, and mixed inhibition
3. Compare models by AIC or F-test to select the best fit
4. Extract Ki (and Ki' for mixed) with standard errors

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
