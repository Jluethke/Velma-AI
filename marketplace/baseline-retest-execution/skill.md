# Baseline Retest Execution

Re-run the relevant security test cases from the baseline against the updated code.

## Inputs

- `relevant-tests`: Security tests to re-run
- `affected-surface`: Areas to focus testing on

## Outputs

- `retest-results`: Results of re-running baseline tests
- `pass-fail-delta`: Tests that changed from pass to fail or vice versa

## Process

1. Execute each relevant security test case against the updated code
2. Record pass/fail status and compare against baseline
3. Flag any tests that previously passed but now fail

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
