# Prognostic Factor Identifier

Identify the most important prognostic factors through variable selection and effect size ranking.

## Inputs

- `cox-model`: Fitted Cox model with all candidate covariates
- `ph-test-results`: Proportional hazards assumption test results

## Outputs

- `prognostic-factors`: Ranked list of significant prognostic factors with hazard ratios
- `forest-plot`: Forest plot of hazard ratios with confidence intervals

## Process

1. Apply stepwise or penalized selection (LASSO) to identify significant factors.
2. Rank factors by the magnitude of the hazard ratio.
3. Generate the forest plot for visual comparison.
4. Report the final parsimonious model with its concordance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
