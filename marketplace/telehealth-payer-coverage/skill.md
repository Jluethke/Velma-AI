# Telehealth Payer Coverage

Verify payer coverage and reimbursement rules for telehealth visits.

## Inputs

- `telehealth-workflow`: Planned visit types and workflow
- `compliance-requirements`: State and federal telehealth regulations

## Outputs

- `payer-coverage-matrix`: Matrix of payer coverage by visit type, CPT code, place of service, and modifier requirements
- `billing-guidelines`: Billing instructions for telehealth visits by payer

## Process

1. Check each major payer's telehealth coverage policies (covered visit types, originating site rules, provider types).
2. Identify the correct CPT codes, place of service codes, and modifiers for telehealth billing.
3. Verify state-specific telehealth regulations (licensure, prescribing, consent).
4. Build the payer coverage matrix and billing guidelines for the billing team.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
