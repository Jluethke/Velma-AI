# Expense Approval Validator

Validate that the proper approval chain was followed for each expense report.

## Inputs

- `expense-reports`: Expense reports with approval history
- `approval-matrix`: Required approvers by amount and department

## Outputs

- `approval-validation`: Approval chain validation results
- `escalation-items`: Reports missing required approvals

## Process

1. Check that each report has the required approver based on amount thresholds.
2. Verify the approver has authority for the submitter's department.
3. Identify reports that bypassed the required approval chain.
4. Route reports missing approvals back for proper authorization.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
