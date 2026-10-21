# Model Fitting And Residual Analyzer

Fit a physical model to the data, assess goodness of fit, analyze residuals for systematic patterns, and extract the quantity of interest with its uncertainty.

## Inputs

- `governing-equations`: The model to fit
- `acquisition-plan`: Data structure and format
- `combined-uncertainty`: Per-point uncertainties for weighted fitting

## Outputs

- `fit-results`: Best-fit parameters with uncertainties and covariance matrix
- `residual-analysis`: Residual plots, autocorrelation, and systematic pattern flags
- `extracted-value`: The measured physical quantity with combined uncertainty

## Process

1. Perform a weighted least-squares or maximum likelihood fit
2. Report parameter values, uncertainties, and chi-squared / degrees of freedom
3. Plot residuals and test for autocorrelation or systematic trends
4. Extract the quantity of interest and propagate fit uncertainty
5. Compare the measured value to the theoretical prediction

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
