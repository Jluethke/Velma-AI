# Expense Reimbursement Processor

Process approved reimbursements and record the expense entries.

## Inputs

- `review-results`: Approved expense items
- `approval-validation`: Confirmed approval chain

## Outputs

- `reimbursement-batch`: Payment batch for approved reimbursements
- `expense-journal-entries`: Journal entries for expense recording

## Process

1. Calculate the total approved reimbursement per employee.
2. Generate the payment batch (ACH or check).
3. Code expenses to the correct GL accounts and cost centers.
4. Post the expense journal entries.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
