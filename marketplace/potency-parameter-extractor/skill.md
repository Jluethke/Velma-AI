# Potency Parameter Extractor

Extract the key potency parameters from the fitted model: EC50/IC50, Hill slope, maximum effect, and minimum effect.

## Inputs

- `fit-results`: Fitted model parameters
- `organized-data`: Original data for context

## Outputs

- `potency-table`: EC50/IC50 with confidence interval, Hill slope, Emax, Emin for each model
- `dose-at-effect`: Inverse prediction: concentration needed for specific effect levels (e.g., EC90)

## Process

1. Extract EC50 (or IC50 for inhibition) directly from the fitted midpoint parameter.
2. Compute the confidence interval for EC50 using the delta method or profile likelihood.
3. Back-calculate concentrations for other effect levels (EC10, EC90) from the fitted curve.
4. Report the Hill coefficient and its interpretation (steepness of the transition).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
