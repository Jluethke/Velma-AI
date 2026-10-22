# Experiment Sample Sizer

Calculate how many observations (users, days, trials) you need for a conclusive result. This number depends on the effect size, the baseline variance, and your error tolerance. Running the experiment for fewer observations than this number guarantees an inconclusive result.

## Inputs

- `hypothesis-statement`: The specific prediction with baseline and target values
- `current-metric-value`: The baseline for variance estimation

## Outputs

- `required-observations`: The number of observations per group (or total, for a before/after design)
- `estimated-runtime`: How many days or weeks to reach the required observations at the current traffic or activity rate

## Process

1. Calculate the effect size: the difference between the target and the baseline, divided by the standard deviation. If you do not have the standard deviation, estimate the plausible range and divide by 4.
2. Use the standard formula: n = ((1.96 + 0.84)^2 * 2 * variance) / effect_size^2 for a two-group test at 95% confidence and 80% power. Adjust the z-scores if you chose different error tolerances.
3. Divide by the daily observation rate to get the runtime. If the runtime is longer than your patience allows, either increase the effect size (care about bigger changes) or accept lower confidence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
