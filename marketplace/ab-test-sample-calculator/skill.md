# Ab Test Sample Calculator

Calculate the sample size and set significance thresholds for each test.

## Inputs

- `testing-roadmap`: The tests to run
- `testing-priorities`: Priority order of tests

## Outputs

- `test-parameters`: Sample size, split ratio, significance level, and minimum detectable effect for each test
- `test-schedule`: When each test runs and how long to wait before declaring a winner

## Process

1. Calculate the minimum sample size for the desired significance level (typically 95%) and minimum detectable effect.
2. Set the split ratio (50/50 for two variants, or holdout percentage for multi-variant).
3. Determine the observation period based on sending volume and sample size.
4. Document the decision criteria for declaring a winner.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
