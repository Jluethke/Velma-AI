# Payment Reminder Sender

Send payment reminders on a scheduled cadence.

## Inputs

- `payment-ledger`: Current payment status for all tenants
- `delinquent-accounts`: Accounts past due

## Outputs

- `reminder-log`: Record of all reminders sent with dates
- `late-fee-assessments`: Late fees applied per lease terms

## Process

1. Send courtesy reminders 3 days before the due date.
2. Send past-due notices on the day after the due date.
3. Apply late fees per the lease terms and notify the tenant.
4. Escalate accounts past 30 days to collections.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
