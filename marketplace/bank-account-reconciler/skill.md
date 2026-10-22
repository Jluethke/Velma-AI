# Bank Account Reconciler

Reconcile all bank and credit card accounts against the general ledger.

## Inputs

- `bank-statements`: Bank and credit card statements for the period
- `general-ledger`: Current general ledger entries

## Outputs

- `reconciliation-report`: Account-by-account reconciliation with variances
- `unmatched-items`: List of unmatched transactions requiring investigation

## Process

1. Import bank statement transactions and ledger entries for each account.
2. Match transactions by amount, date, and reference number.
3. Flag unmatched items and investigate discrepancies.
4. Document reconciling items (outstanding checks, deposits in transit).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
