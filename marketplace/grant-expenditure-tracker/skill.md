# Grant Expenditure Tracker

Track expenditures against the grant budget by cost category.

## Inputs

- `grant-fund-structure`: Fund codes and budget categories
- `transaction-data`: Expense transactions charged to the grant

## Outputs

- `budget-vs-actual`: Budget to actual comparison by cost category
- `overspend-alerts`: Categories approaching or exceeding budget limits

## Process

1. Code each expense to the correct grant cost category.
2. Compare cumulative spending to the budget by category.
3. Flag categories approaching the budget limit (80%+ spent).
4. Calculate the burn rate and project whether funds will last the grant period.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
