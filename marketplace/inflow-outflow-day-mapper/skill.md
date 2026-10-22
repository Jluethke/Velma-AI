# Inflow Outflow Day Mapper

Map every recurring inflow and outflow to its exact day of the month, creating a daily cash flow calendar.

## Inputs

- `account-transactions`: 3 months of transaction history with dates and amounts
- `account-context`: Whether this is a personal account, business operating account, or departmental budget

## Outputs

- `daily-flow-calendar`: Every recurring inflow and outflow mapped to its day of month with amount and category
- `flow-classification`: Each flow classified as fixed-date (rent, payroll), variable-date (groceries, vendor invoices), or discretionary

## Process

1. Extract every transaction from the history. Group by payee or source. For each group, identify the typical day of month it hits (mode of the day-of-month values across 3 months).
2. Classify each flow: fixed-date flows land on the same day every month (tolerance of 1 day). Variable-date flows land within a 5-day window. Discretionary flows have no pattern.
3. Build the daily calendar: for each day 1 through 31, list every inflow and outflow that typically lands on that day, with its average amount.
4. Flag any flow that is both large (top 20% by amount) and variable-date, because these are the ones you can potentially shift.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
