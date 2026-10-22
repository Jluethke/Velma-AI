# Invoice Approval Router

Route the invoice for approval based on amount thresholds and department rules.

## Inputs

- `extracted-fields`: Structured invoice data including amount
- `validation-result`: Whether the invoice passed PO validation

## Outputs

- `approval-decision`: Approved, rejected, or escalated with approver name and timestamp
- `approval-notes`: Any notes or conditions from the approver

## Process

1. Determine the approval routing based on invoice amount and department.
2. Send the invoice to the designated approver with the validation report.
3. Track the approval status against the SLA.
4. Record the approval decision and any conditions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
