# Email Test Result Analyzer

Analyze the test results and determine the winner.

## Inputs

- `test-design`: The test configuration
- `test-hypothesis`: The original hypothesis

## Outputs

- `test-results`: Results per variant (metric values, confidence interval, statistical significance)
- `test-conclusion`: Winner declaration, whether the hypothesis was confirmed, and the recommended next test

## Process

1. Pull the results for each variant after the test duration.
2. Calculate the statistical significance (p-value or confidence interval).
3. Declare the winner if significance is reached; declare inconclusive if not.
4. Document the learning and recommend the next test to run.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
