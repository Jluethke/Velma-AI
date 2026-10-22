# Expense Time Series Build

Build a time series of each expense category over the past 6-12 months.

## Inputs

- `expense-data`: Monthly expense data by category for the past 6-12 months
- `expense-categories`: The categories to track (may be personal or business)

## Outputs

- `expense-time-series`: Each category's monthly spending plotted over time
- `category-totals`: Total spending per category over the full period

## Process

1. Collect monthly spending data for each category. Use actual transaction data (bank statements, accounting software), not budgeted amounts.
2. Plot each category as a line over time. Even a simple spreadsheet chart reveals patterns that raw numbers hide.
3. Include all categories, even ones you think are stable. Creeping expenses often hide in categories you do not monitor because you assume they are fixed.
4. If data is not available for 6 months, start tracking now and wait. You cannot calculate velocity without at least 3 months of data.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
