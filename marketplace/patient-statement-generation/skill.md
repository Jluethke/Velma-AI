# Patient Statement Generation

Generate the patient statement after insurance has processed the claim.

## Inputs

- `adjudicated-claims`: Claims with insurance payment applied and remaining patient balance
- `patient-account`: Patient account information and contact details

## Outputs

- `patient-statement`: Itemized statement showing services, insurance payments, adjustments, and patient balance due
- `balance-summary`: Total balance due, age of charges, and payment due date

## Process

1. Calculate the patient responsibility from the ERA/EOB (copay, coinsurance, deductible, non-covered).
2. Generate the itemized statement with service dates, descriptions, and amounts.
3. Set the payment due date (typically 30 days from statement date).
4. Send the statement via the patient's preferred method (mail, email, portal).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
