# Rent Reconciliation Reporter

Reconcile payments and produce the collection report.

## Inputs

- `payment-ledger`: Payment status for all tenants
- `late-fee-assessments`: Late fees applied

## Outputs

- `reconciliation-report`: Reconciled rent collection report for the period
- `collection-metrics`: Collection rate, average days to pay, delinquency rate

## Process

1. Reconcile all payments against invoices and late fees.
2. Calculate collection metrics: rate, average days to pay, delinquency rate.
3. Produce the period collection report with variance analysis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
