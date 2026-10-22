# Loan Underwriter

Underwrite the loan by evaluating income, debt-to-income ratio, and collateral.

## Inputs

- `credit-report-summary`: Borrower credit profile
- `verified-documents`: Income and asset documentation
- `loan-request`: Requested amount, purpose, term

## Outputs

- `underwriting-decision`: Approved, approved with conditions, or denied with rationale
- `loan-terms`: Final rate, term, conditions, and covenants if approved

## Process

1. Calculate the debt-to-income ratio from verified income and existing obligations.
2. Evaluate the collateral value (appraisal for mortgage, asset verification for secured loans).
3. Apply the lending criteria and make the credit decision.
4. Document the rationale and any conditions for approval.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
