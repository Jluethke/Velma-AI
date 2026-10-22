# Automated Voice Test Runner

Run the automated tests against the voice bot and collect results.

## Inputs

- `test-audio-set`: Test audio inputs
- `expected-results`: Expected outcomes for each test

## Outputs

- `test-results`: Pass/fail results for each test case with actual vs expected comparison
- `failure-analysis`: Analysis of failed test cases grouped by failure type

## Process

1. Configure the test harness to send audio inputs to the bot and capture responses.
2. Run the high-priority test cases first.
3. Compare actual results to expected results for each test case.
4. Group failures by type (intent misclassification, slot extraction error, dialog flow error, latency).
5. Calculate the pass rate by category.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
