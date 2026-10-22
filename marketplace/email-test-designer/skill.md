# Email Test Designer

Design the test setup: sample size, duration, and split.

## Inputs

- `test-hypothesis`: The hypothesis and target metric
- `test-variables`: What is being tested
- `current-metrics`: Baseline metrics for sample size calculation

## Outputs

- `test-design`: Test configuration: sample size per variant, split percentage, send timing, and duration
- `statistical-plan`: The statistical method (significance level, minimum detectable effect, power)

## Process

1. Calculate the required sample size based on the baseline metric, minimum detectable effect, and 95% confidence.
2. Set the split (typically 50/50 for two variants, or 10/10/80 for subject line tests with auto-send winner to remainder).
3. Set the test duration (enough time to collect the required sample).
4. Document the statistical method and how the winner will be declared.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
