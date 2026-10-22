# Accrual Adjustment Recorder

Record accruals, deferrals, and prepaid adjustments for the period.

## Inputs

- `reconciliation-report`: Completed bank reconciliation
- `accrual-schedule`: Schedule of recurring accruals and prepaids

## Outputs

- `adjustment-entries`: Journal entries for accruals and prepaids
- `updated-ledger`: General ledger with adjustments posted

## Process

1. Review the accrual schedule for recurring items (rent, insurance, payroll).
2. Calculate the adjustment amount for each item based on the period.
3. Prepare and post the adjusting journal entries.
4. Reverse prior-period accruals that have now been invoiced.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
