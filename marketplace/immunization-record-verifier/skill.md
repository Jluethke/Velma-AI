# Immunization Record Verifier

Verify the child's immunization records against state requirements.

## Inputs

- `enrollment-packet`: The completed enrollment forms including medical records

## Outputs

- `immunization-status`: Whether the child's immunizations are current, pending, or exempt
- `compliance-notes`: Any immunizations due soon or exemption documentation on file

## Process

1. Compare the child's immunization record against the state-required schedule for their age.
2. Identify any missing or upcoming immunizations.
3. Record any exemptions (medical, religious) with supporting documentation.
4. Notify the family of any immunizations needed before the start date.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
