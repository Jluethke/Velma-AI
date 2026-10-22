# Collections Follow Up Sequence

Send follow-up reminders and contact the patient about unpaid balances.

## Inputs

- `balance-summary`: Outstanding balance and aging information
- `patient-account`: Patient contact details and payment history

## Outputs

- `follow-up-record`: Record of all collection contacts (dates, methods, responses)
- `payment-arrangement`: Payment plan or payment made, if any

## Process

1. Send the second statement at 30 days past due with a reminder notice.
2. Make a phone call at 60 days past due to discuss payment options.
3. Offer a payment plan for balances the patient cannot pay in full.
4. Send a final notice at 90 days warning of potential referral to collections.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
