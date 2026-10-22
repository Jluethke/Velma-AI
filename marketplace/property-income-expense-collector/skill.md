# Property Income Expense Collector

Collect all income and expense data for the reporting period.

## Inputs

- `property-portfolio`: Properties to report on
- `reporting-period`: Month and year for the report

## Outputs

- `income-data`: All income by category: rent, late fees, other
- `expense-data`: All expenses by category: maintenance, insurance, taxes, management fees

## Process

1. Pull all income records for the period: rent collected, late fees, application fees, other.
2. Pull all expense records: maintenance, insurance, property taxes, management fees, utilities.
3. Verify all transactions are properly categorized.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
