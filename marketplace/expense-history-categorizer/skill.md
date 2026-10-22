# Expense History Categorizer

Categorize 6 to 12 months of expense history into consistent categories for velocity analysis.

## Inputs

- `expense-history`: 6 to 12 months of transactions with dates, amounts, and descriptions
- `category-scheme`: Whether to use a personal scheme (housing, food, transport, health, discretionary) or business scheme (payroll, COGS, marketing, overhead, R&D)

## Outputs

- `categorized-expenses`: Each transaction assigned to a category, with monthly totals per category
- `category-list`: The final list of categories used, with the number of transactions and total amount in each

## Process

1. Assign each transaction to a category based on the payee or description. For ambiguous transactions, use the amount and frequency to decide (a $5 daily charge is likely food, not entertainment).
2. Collapse categories with fewer than 3 transactions per month into an 'other' bucket. Categories need enough data points to calculate a meaningful growth rate.
3. Calculate the monthly total for each category. Produce a table: rows are categories, columns are months, cells are totals.
4. Verify the categorization covers at least 90% of total spending. If it doesn't, split the 'other' bucket further until it does.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
