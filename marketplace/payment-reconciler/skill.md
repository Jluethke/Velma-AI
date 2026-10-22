# Payment Reconciler

Apply payments received and reconcile the receivables ledger.

## Inputs

- `bank-deposits`: Incoming payment records
- `issued-invoices`: Open invoices to match against

## Outputs

- `applied-payments`: Payments matched to invoices
- `unapplied-cash`: Unidentified payments requiring investigation

## Process

1. Match payments to open invoices by customer, amount, and reference.
2. Apply partial payments and track remaining balances.
3. Investigate and resolve unapplied or unidentified payments.
4. Post payment entries and update the AR subledger.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
