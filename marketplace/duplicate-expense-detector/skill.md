# Duplicate Expense Detector

Check for duplicate submissions across expense reports and corporate card statements.

## Inputs

- `expense-reports`: Current and recent expense reports
- `corporate-card-data`: Corporate credit card transaction data

## Outputs

- `duplicate-flags`: Potential duplicate expenses identified
- `card-reconciliation`: Reconciliation of card charges to expense reports

## Process

1. Compare expense items across reports for matching amounts, dates, and vendors.
2. Cross-reference personal reimbursement claims against corporate card charges.
3. Flag potential duplicates for investigation.
4. Resolve confirmed duplicates and adjust reimbursement amounts.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
