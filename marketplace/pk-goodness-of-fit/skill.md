# Pk Goodness Of Fit

Assess model adequacy using diagnostic plots and statistical tests.

## Inputs

- `fitted-parameters`: Model parameter estimates
- `pk-dataset`: Observed data for comparison

## Outputs

- `gof-plots`: Observed vs predicted, residuals vs time, residuals vs predicted, QQ plot
- `model-adequacy-assessment`: Whether the model adequately describes the data

## Process

1. Generate observed vs population-predicted and observed vs individual-predicted plots.
2. Plot conditional weighted residuals (CWRES) vs time and vs predicted concentration.
3. Check for systematic trends in residuals that indicate model misspecification.
4. For population models, inspect individual fits for poorly described subjects.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
