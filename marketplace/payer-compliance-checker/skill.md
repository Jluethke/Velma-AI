# Payer Compliance Checker

Ensure documentation meets payer-specific requirements.

## Inputs

- `clinical-notes`: Provider's documentation
- `supported-codes`: Codes with adequate evidence

## Outputs

- `compliance-status`: Pass or fail for each payer requirement
- `denial-risk-flags`: Items at risk of claim denial

## Process

1. Check medical necessity documentation for each service.
2. Verify prior authorization documentation is present.
3. Confirm that the level of service matches the documentation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
