# Dose Response Parameter Estimator

Estimate key pharmacological or toxicological parameters (EC50, LD50, NOAEL, BMD) from the fitted model with confidence intervals.

## Inputs

- `selected-dr-model`: Best-fit model type and parameters
- `cleaned-data`: Validated dose-response dataset

## Outputs

- `parameter-estimates`: EC50/LD50/NOAEL/BMD with 95% confidence intervals
- `fitted-curve`: Smooth fitted curve overlaid on data points

## Process

1. Compute point estimates for EC50, LD50, or the relevant potency metric.
2. Estimate NOAEL from the last dose without significant effect.
3. Compute benchmark dose (BMD) and its lower confidence limit (BMDL).
4. Generate the fitted curve with confidence band for the report.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
