# New Surface Analysis

Check for new attack surface introduced by the changes.

## Inputs

- `change-set`: Code changes
- `affected-surface`: Changed attack surface areas

## Outputs

- `new-surface-findings`: New endpoints, parameters, or entry points added
- `new-risk-areas`: New areas that need security test coverage

## Process

1. Identify new API endpoints, parameters, or user-facing features
2. Test new entry points for standard vulnerability classes
3. Flag areas that have no existing security test coverage

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
