# Response Surface Modeler

Fit a response surface model to the fermentation data, identify the optimum, and validate it.

## Inputs

- `final-responses`: Titer, yield, productivity at each design point
- `experimental-design`: Factor levels for model fitting

## Outputs

- `response-surface-model`: Fitted quadratic model with coefficients, R-squared, and ANOVA
- `predicted-optimum`: Factor levels that maximize the objective, with predicted response and confidence interval

## Process

1. Fit a second-order polynomial model (main effects, interactions, quadratic terms).
2. Check model adequacy: R-squared, adjusted R-squared, lack-of-fit test, residual plots.
3. Locate the optimum by solving the response surface equations or by numerical search.
4. Report the predicted optimum conditions and expected response with confidence bounds.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
