# Receivable Payable Reconciler

Reconcile accounts receivable and accounts payable subledgers to the general ledger.

## Inputs

- `updated-ledger`: General ledger after adjustments
- `subledger-reports`: AR and AP subledger detail reports

## Outputs

- `subledger-reconciliation`: AR and AP reconciliation with variances
- `aging-summary`: Aging summary for receivables and payables

## Process

1. Pull the AR subledger total and compare to the GL control account.
2. Pull the AP subledger total and compare to the GL control account.
3. Investigate and resolve any differences.
4. Generate aging summaries for both receivables and payables.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
