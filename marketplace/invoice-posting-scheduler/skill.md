# Invoice Posting Scheduler

Post the approved invoice to the accounting system and schedule the payment.

## Inputs

- `extracted-fields`: Structured invoice data
- `approval-decision`: The approval decision and conditions

## Outputs

- `posting-confirmation`: Confirmation that the invoice was posted to the ledger
- `payment-schedule`: Scheduled payment date and method

## Process

1. Post the invoice to the general ledger with the correct GL coding.
2. Schedule the payment based on payment terms and cash flow.
3. Send confirmation to the vendor if required.
4. Produce the processed invoice record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
