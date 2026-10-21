# Change Surface Identification

Identify the changed components and their attack surface impact.

## Inputs

- `change-set`: Code diff or list of changed files and components
- `security-baseline`: Prior security test results and known attack surface

## Outputs

- `affected-surface`: Attack surface areas affected by the changes
- `relevant-tests`: Security tests that apply to the changed areas

## Process

1. Analyze the code diff for security-relevant changes: auth, input handling, crypto, data access
2. Map changes to attack surface areas
3. Select the security test cases from the baseline that cover the affected areas

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
