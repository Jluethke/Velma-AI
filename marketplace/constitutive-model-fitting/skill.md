# Constitutive Model Fitting

Fit the rheological data to a constitutive model (Cross, Carreau, Herschel-Bulkley, Maxwell) to extract material parameters.

## Inputs

- `flow-curve-data`: Steady-shear viscosity vs shear rate
- `frequency-sweep-data`: G' and G'' vs frequency

## Outputs

- `fitted-model-parameters`: Best-fit model parameters with confidence intervals
- `model-fit-quality`: Residual plots and goodness-of-fit statistics

## Process

1. Select candidate constitutive models based on the observed flow behavior
2. Fit each candidate to the steady-shear and/or oscillatory data using nonlinear regression
3. Compare models by residual analysis and information criteria (AIC or BIC)
4. Report the best-fit parameters with 95% confidence intervals

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
