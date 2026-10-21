# Regression Vuln Check

Test for re-introduction of previously fixed vulnerabilities.

## Inputs

- `change-set`: Code changes
- `security-baseline`: Prior findings and fixes

## Outputs

- `regression-findings`: Previously fixed vulnerabilities that have returned
- `fix-status`: Status of each prior fix in the new code

## Process

1. Check if changes revert or weaken prior security fixes
2. Re-test specific proof-of-concept payloads from prior findings
3. Verify that mitigations for known issues remain in place

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
