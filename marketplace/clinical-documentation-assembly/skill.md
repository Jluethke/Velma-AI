# Clinical Documentation Assembly

Gather and organize the clinical documentation required for the authorization submission.

## Inputs

- `auth-requirements`: Required documentation list from the payer
- `patient-insurance`: Patient and insurance identifiers

## Outputs

- `auth-package`: Complete authorization submission package with clinical notes, test results, and payer forms
- `missing-items`: Any documentation still needed before submission

## Process

1. Pull the relevant clinical notes, imaging results, lab results, and referral from the patient record.
2. Complete the payer's authorization request form.
3. Write the clinical rationale or letter of medical necessity if required.
4. Verify the package is complete before submission.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
