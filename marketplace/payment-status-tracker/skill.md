# Payment Status Tracker

Track payment status and aging for all outstanding invoices.

## Inputs

- `issued-invoices`: All outstanding invoices
- `bank-deposits`: Incoming payment records

## Outputs

- `aging-report`: Invoice aging report (current, 30, 60, 90+ days)
- `overdue-list`: List of overdue invoices with customer contact info

## Process

1. Match incoming payments to open invoices.
2. Calculate days outstanding for each unpaid invoice.
3. Categorize into aging buckets (current, 30, 60, 90+ days).
4. Generate the overdue list sorted by amount and days outstanding.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
