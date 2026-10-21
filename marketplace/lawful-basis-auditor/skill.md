# Lawful Basis Auditor

Audit the lawful basis for each processing activity in the register.

## Inputs

- `processing-register`: All processing activities
- `regulatory-landscape`: GDPR and member state requirements

## Outputs

- `basis-audit-results`: Lawful basis assessment per activity
- `basis-gaps`: Activities with weak or missing lawful basis

## Process

1. Review the stated lawful basis for each processing activity
2. Verify that consent mechanisms meet GDPR standards where consent is the basis
3. Check legitimate interest assessments for completeness
4. Flag activities with no documented lawful basis

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
