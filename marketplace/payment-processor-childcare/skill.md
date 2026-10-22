# Payment Processor Childcare

Process tuition payments and track collection status.

## Inputs

- `monthly-invoices`: The invoices sent to families

## Outputs

- `payment-ledger`: Record of payments received with date, amount, method, and family
- `past-due-accounts`: List of accounts past due with amount owed and days overdue

## Process

1. Record each payment received (ACH, credit card, check, cash) against the family's invoice.
2. Apply late fees per the fee policy when payment is past the due date.
3. Send payment reminders at defined intervals (due date, 7 days past, 14 days past).
4. Flag accounts for director follow-up when past due beyond the threshold.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
