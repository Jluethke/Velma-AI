# Clinical Sample Size Calculator

Calculate the required sample size from the expected effect, variability, desired power, alpha level, and anticipated dropout rate.

## Inputs

- `endpoint-definitions`: Primary endpoint and its properties
- `prior-evidence`: Expected effect size and variability from pilot or prior data

## Outputs

- `sample-size-report`: Required N per arm and total, with power, alpha, effect size, and dropout adjustment
- `sensitivity-analysis`: How sample size changes under different assumptions about effect size and dropout
- `enrollment-timeline`: Expected accrual rate and time to reach target enrollment

## Process

1. Specify the test statistic matched to the endpoint type (t-test, chi-square, log-rank, mixed model)
2. Set alpha, power, and the clinically meaningful effect size
3. Calculate raw N using the appropriate formula or simulation
4. Inflate for expected dropout and non-compliance
5. Run sensitivity analyses across a range of effect sizes

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
