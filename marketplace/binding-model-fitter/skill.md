# Binding Model Fitter

Fit saturation binding data to one-site, two-site, or Hill models.

## Inputs

- `specific-binding`: Specific binding vs free ligand concentration
- `model-candidates`: Models to test: one-site, two-site, Hill equation

## Outputs

- `fit-results`: Fitted parameters (Kd, Bmax, Hill coefficient) for each model with standard errors
- `model-selection`: Best model by F-test or AIC comparing one-site vs two-site vs Hill

## Process

1. Fit the one-site saturation model (B = Bmax * [L] / (Kd + [L])) by nonlinear regression
2. Fit the two-site model and the Hill equation as alternatives
3. Compare models using the extra sum-of-squares F-test or Akaike information criterion
4. Select the simplest model that adequately describes the data

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
