# Discharge Medication Reconciler

Reconcile and finalize discharge medications.

## Inputs

- `patient-record`: Clinical record with current orders
- `service-referrals`: Post-discharge care needs

## Outputs

- `discharge-med-list`: Final discharge medication list with instructions
- `prescription-set`: New or changed prescriptions to be filled

## Process

1. Compare inpatient medications against pre-admission medications.
2. Determine which medications to continue, modify, or discontinue.
3. Generate new prescriptions and verify pharmacy coverage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
