# Test Execution And Rules

Set execution rules: randomization, no peeking, stopping criteria.

## Inputs

- `required-sample-size`: The sample size requirement
- `test-duration`: The planned duration

## Outputs

- `execution-rules`: Randomization method, when results can be checked, stopping criteria
- `test-documentation`: Pre-registered test plan: hypothesis, metric, MDE, sample size, duration, rules

## Process

1. Randomize properly: each participant independently assigned. No alternating.
2. No peeking: do not check results before required sample size. Early peeking inflates false positives.
3. Only stop early for evidence of harm. Define the harm threshold before starting.
4. Document everything before the test starts. Pre-registration prevents after-the-fact rationalization.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
