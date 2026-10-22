# Payroll Register Reconciler

Reconcile the payroll register to the general ledger and bank account.

## Inputs

- `net-pay-register`: Payroll register for the period
- `payment-file`: ACH and check distribution records

## Outputs

- `payroll-reconciliation`: Reconciliation of payroll to GL and bank
- `payroll-journal-entries`: Journal entries for payroll expense and liabilities

## Process

1. Compare the payroll register totals to the GL payroll accounts.
2. Verify the bank account reflects the correct total disbursement.
3. Investigate and resolve any differences.
4. Post the payroll journal entries to the general ledger.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
