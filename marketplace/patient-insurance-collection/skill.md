# Patient Insurance Collection

Collect the patient's insurance information from their card and intake forms.

## Inputs

- `patient-id`: Patient identifier or account number
- `insurance-card-data`: Information from the insurance card (payer, plan, member ID, group number)

## Outputs

- `insurance-profile`: Structured insurance record with payer, plan, member ID, group, and effective dates
- `secondary-insurance`: Secondary insurance information if applicable

## Process

1. Record the primary insurance payer, plan name, member ID, and group number from the card.
2. Confirm the subscriber relationship (self, spouse, child, other).
3. Check for secondary insurance and record if present.
4. Verify that the information matches the practice management system.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
