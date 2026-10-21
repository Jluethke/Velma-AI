# Sensitivity Analysis Runner

Test how sensitive the causal estimate is to violations of identifying assumptions, especially unmeasured confounding.

## Inputs

- `causal-estimate`: the primary treatment effect estimate
- `identifying-assumptions`: the assumptions to stress-test

## Outputs

- `sensitivity-results`: E-value, Rosenbaum bounds, or calibrated sensitivity contour
- `robustness-verdict`: how strong unmeasured confounding would need to be to nullify the result

## Process

1. Compute the E-value: the minimum strength of association an unmeasured confounder would need to explain away the estimate
2. For matching designs, compute Rosenbaum bounds across a range of gamma values
3. If multiple identification strategies are feasible, compare estimates across them
4. State the verdict: how plausible it is that confounding of the required magnitude exists

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
