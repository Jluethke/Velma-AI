# Subsidy Billing Manager

Manage billing for families receiving childcare subsidies or vouchers.

## Inputs

- `payment-ledger`: Payment records showing private-pay and subsidy portions
- `past-due-accounts`: Past due accounts for reconciliation

## Outputs

- `subsidy-claims`: Claims submitted to subsidy programs with attendance documentation
- `billing-record`: Complete billing record reconciling private pay, subsidy, and outstanding balances

## Process

1. Identify families receiving state vouchers, employer subsidies, or other assistance.
2. Track attendance for subsidy-eligible families (most programs require attendance documentation).
3. Submit claims to the subsidy program with the required attendance records.
4. Reconcile subsidy payments received against claims submitted.
5. Invoice the family for any copay or balance not covered by the subsidy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
