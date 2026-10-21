# Baseline Comparison

Compare the full results against the security baseline to quantify the delta.

## Inputs

- `retest-results`: Baseline retest outcomes
- `regression-findings`: Returned vulnerabilities
- `new-surface-findings`: New attack surface

## Outputs

- `security-delta`: Net change in security posture from the code change
- `coverage-gaps`: Areas where security test coverage is now insufficient

## Process

1. Calculate the net security delta: new findings minus resolved findings
2. Identify areas where test coverage has fallen below threshold
3. Compare overall security posture to the pre-change baseline

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
