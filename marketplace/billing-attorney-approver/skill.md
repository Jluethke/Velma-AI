# Billing Attorney Approver

Route the pre-bill to the billing attorney for final review and approval.

## Inputs

- `pre-bill`: Draft invoice for review
- `pre-bill-summary`: Summary of totals

## Outputs

- `approved-bill`: The approved invoice after attorney review
- `approval-notes`: Notes from the billing attorney on any adjustments

## Process

1. Send the pre-bill to the billing attorney with the summary.
2. Record any additional write-downs or description changes requested by the billing attorney.
3. Apply the final adjustments and mark the bill as approved.
4. Record the approval in the billing system.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
