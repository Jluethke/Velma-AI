# Pre Bill Generator

Generate the pre-bill draft for attorney review.

## Inputs

- `reviewed-entries`: Compliant time entries
- `adjustment-log`: Adjustments applied during review

## Outputs

- `pre-bill`: Draft invoice showing all entries, rates, totals, and expenses
- `pre-bill-summary`: Summary of total fees, expenses, and adjustments

## Process

1. Group entries by matter and timekeeper.
2. Apply the approved rates to calculate fees for each entry.
3. Add any reimbursable expenses (filing fees, travel, copying).
4. Generate the pre-bill with line items, subtotals, and a grand total.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
