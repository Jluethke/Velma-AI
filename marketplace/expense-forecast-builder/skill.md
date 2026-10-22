# Expense Forecast Builder

Build the expense forecast by category: personnel, operating, and capital.

## Inputs

- `department-requests`: Department budget requests
- `headcount-plan`: Planned headcount and compensation

## Outputs

- `expense-forecast`: Projected expenses by category and period
- `capex-plan`: Capital expenditure plan

## Process

1. Calculate personnel costs from the headcount plan (salary, benefits, taxes).
2. Consolidate operating expense requests by category.
3. Separate capital expenditures and plan depreciation/amortization.
4. Apply inflation assumptions to applicable expense categories.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
