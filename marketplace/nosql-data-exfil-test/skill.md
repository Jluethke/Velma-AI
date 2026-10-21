# Nosql Data Exfil Test

Test for data exfiltration through NoSQL injection, assessing the scope of accessible data.

## Inputs

- `auth-bypass-results`: Authentication bypass results
- `extracted-data-samples`: Data samples already extracted

## Outputs

- `exfil-scope`: Scope of data accessible through injection
- `data-sensitivity-rating`: Sensitivity rating of exposed data

## Process

1. Enumerate collections and fields accessible through injection
2. Assess the sensitivity of extractable data
3. Test for cross-collection access through injection chaining

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
