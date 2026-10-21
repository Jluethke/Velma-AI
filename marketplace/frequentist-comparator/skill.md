# Frequentist Comparator

Run the corresponding frequentist analysis and compare results to the Bayesian posterior for calibration and audience communication.

## Inputs

- `observed-data`: the dataset
- `posterior-summary-table`: Bayesian parameter estimates

## Outputs

- `frequentist-estimates`: MLE point estimates, standard errors, confidence intervals, p-values
- `comparison-table`: side-by-side Bayesian vs frequentist results with interpretation notes

## Process

1. Fit the corresponding frequentist model (MLE, OLS, GLM, etc.)
2. Extract point estimates, confidence intervals, and p-values
3. Produce a side-by-side comparison table of Bayesian vs frequentist results
4. Note where they agree, where they diverge, and why (prior influence, small sample, etc.)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
