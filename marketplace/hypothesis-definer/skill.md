# Hypothesis Definer

Define the hypothesis and primary metric.

## Inputs

- `test-question`: What you want to learn
- `context`: The test environment

## Outputs

- `hypothesis`: The testable hypothesis with minimum detectable effect
- `primary-metric`: The single metric that determines the result

## Process

1. State the hypothesis: what do you expect to happen, and by how much?
2. Define the minimum detectable effect: the smallest improvement worth implementing.
3. Define the primary metric: one number, one decision. Testing multiple metrics inflates false positives.
4. Define the baseline: current metric value needed for sample size calculation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
