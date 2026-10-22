# Ab Test Executor

Execute the A/B test and collect the results.

## Inputs

- `test-parameters`: Sample sizes and significance thresholds
- `test-schedule`: When the test runs

## Outputs

- `test-results`: Raw results for each variant (opens, clicks, conversions, unsubscribes)
- `statistical-analysis`: Statistical significance calculation and confidence interval

## Process

1. Configure the test in the email platform with the defined variants and split.
2. Send to the test audience.
3. Wait for the observation period to complete.
4. Pull the results for each variant.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
