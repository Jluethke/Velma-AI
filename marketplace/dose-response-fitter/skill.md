# Dose Response Fitter

Fit dose-response curves and extract IC50 or EC50 values.

## Inputs

- `percent-viability`: Mean percent viability at each concentration
- `concentration-series`: Compound concentrations in molar units

## Outputs

- `dose-response-fit`: Fitted four-parameter logistic curve with IC50, Hill slope, top, and bottom
- `fit-quality`: R-squared, confidence intervals on IC50, and residual plot

## Process

1. Plot percent viability vs log concentration for each compound
2. Fit a four-parameter logistic (Hill) model to each compound's data
3. Extract IC50 (or EC50) with 95% confidence interval from the fit
4. Report Hill slope, top plateau, bottom plateau, and goodness of fit

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
