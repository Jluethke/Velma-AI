# Eva Expense Collector

Gather every expense with its timing.

## Inputs

- `expense-source`: The statements and receipts to pull from
- `review-window`: The period under review

## Outputs

- `expense-ledger`: Every expense with its amount and date
- `timing-tags`: Each expense tagged recurring, periodic, or one-time

## Process

1. Pull every expense for the window from statements and receipts.
2. Record the amount and the date of each.
3. Tag each expense as recurring, periodic, or one-time.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
