# Rca Cause Verifier

Verify the root cause with data or experiment.

## Inputs

- `cause-hypotheses`: Candidate root causes
- `evidence-package`: Available evidence

## Outputs

- `verified-root-cause`: Confirmed root cause with supporting evidence
- `verification-data`: Data or experimental results confirming the cause

## Process

1. Design tests to confirm or eliminate each candidate cause
2. Run the tests (reproduce the failure, or demonstrate that removing the cause prevents it)
3. Confirm that the verified cause explains all aspects of the is/is-not analysis
4. Document the evidence supporting the root cause determination

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
