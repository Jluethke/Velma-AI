# Expense Submission Reviewer

Review submitted expense reports against company policy and documentation requirements.

## Inputs

- `expense-reports`: Submitted expense reports with receipts
- `expense-policy`: Company expense reimbursement policy

## Outputs

- `review-results`: Each expense item marked as approved, questioned, or denied
- `policy-exceptions`: Items that fall outside policy limits or categories

## Process

1. Verify each expense item has a valid receipt or documentation.
2. Check amounts against policy limits (per diem, mileage rate, category caps).
3. Verify the business purpose is documented for each expense.
4. Flag items that exceed limits or lack documentation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
