# Security Test Case Writer

Write security test cases for each identified threat so mitigations are testable.

## Inputs

- `threat-list`: Threats per component with category and description
- `risk-priorities`: Threats ranked by risk

## Outputs

- `security-test-cases`: Test cases per threat with setup, action, and expected outcome
- `test-coverage-matrix`: Matrix mapping each threat to its test cases

## Process

1. For each threat, define the test setup (preconditions, test data, attacker profile).
2. Write the test action that attempts to exploit the threat.
3. Define the expected outcome that proves the mitigation works.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
