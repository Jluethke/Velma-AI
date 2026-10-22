# Noncompliance Identifier

Identify and assess all instances of non-compliant usage.

## Inputs

- `compliance-status`: Compliance status per product
- `open-source-list`: Open source components

## Outputs

- `noncompliance-list`: All non-compliant usage with severity
- `exposure-estimate`: Financial and legal exposure estimate

## Process

1. List every non-compliant product with the nature of the violation
2. Estimate financial exposure (true-up costs, penalties)
3. Check open source license violations (GPL copyleft, attribution)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
