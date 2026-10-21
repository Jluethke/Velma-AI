# Mitigation Implementer

Implement security mitigations alongside the feature code, one per identified threat.

## Inputs

- `security-test-cases`: Test cases per threat with setup, action, and expected outcome
- `feature-specification`: Description of the feature being developed

## Outputs

- `mitigation-implementations`: Code changes and configurations implementing each mitigation
- `implementation-notes`: Notes on design decisions and trade-offs for each mitigation

## Process

1. For each threat, select the mitigation approach (input validation, access check, encryption, rate limit).
2. Implement the mitigation in the feature code.
3. Document the design decision and any trade-offs.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
