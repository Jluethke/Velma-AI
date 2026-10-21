# Mitigation Verification Runner

Run the security test cases against the implemented mitigations and verify they pass.

## Inputs

- `mitigation-implementations`: Code changes implementing each mitigation
- `security-test-cases`: Test cases per threat

## Outputs

- `test-results`: Pass/fail result for each security test case
- `remaining-risks`: Any threats where mitigations are incomplete or tests fail

## Process

1. Execute each security test case against the implemented feature.
2. Record pass/fail and capture evidence for each test.
3. Identify any remaining risks where tests fail or mitigations are incomplete.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
