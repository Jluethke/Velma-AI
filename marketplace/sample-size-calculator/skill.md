# Sample Size Calculator

Compute the minimum sample size needed to detect the target effect size with the specified power and alpha level.

## Inputs

- `target-effect-size`: The effect size to detect
- `selected-test`: The statistical test that will be used

## Outputs

- `minimum-sample-size`: The calculated minimum N (total and per group)
- `power-curve`: Power as a function of N around the minimum, showing sensitivity

## Process

1. Set alpha (typically 0.05) and power (typically 0.80 or 0.90).
2. Use the analytical formula or simulation for the selected test and effect size.
3. Compute N for the primary analysis; if multiple comparisons are planned, adjust alpha.
4. Generate a power curve showing how power changes with N above and below the minimum.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
