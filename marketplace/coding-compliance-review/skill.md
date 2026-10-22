# Coding Compliance Review

Verify the coded encounter for compliance with payer rules and coding guidelines.

## Inputs

- `coded-encounter`: Encounter with assigned codes
- `coding-notes`: Rationale and queries

## Outputs

- `compliant-encounter`: Encounter that has passed compliance checks
- `compliance-flags`: Any issues found during compliance review (bundling, modifier misuse, medical necessity)

## Process

1. Check for correct use of modifiers and code bundling rules (CCI edits).
2. Verify medical necessity by matching diagnosis codes to procedure codes against payer LCD/NCD policies.
3. Confirm that the E/M level matches the documented complexity.
4. Return the compliant encounter or flag issues for correction.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
