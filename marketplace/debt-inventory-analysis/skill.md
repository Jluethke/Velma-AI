# Debt Inventory Analysis

Catalog all debts with balances, rates, minimums, and calculate total payoff cost under current terms.

## Inputs

- `debt_list`: All debts with balances and rates
- `monthly_income`: Take-home monthly income
- `monthly_expenses`: Fixed monthly expenses

## Outputs

- `debt_summary`: Total debt, weighted average rate, minimum payments
- `available_extra`: Monthly amount available above minimums
- `baseline_payoff`: Payoff timeline at minimum payments only

## Process

1. List each debt with balance, APR, minimum payment
2. Calculate total minimum payments
3. Determine free cash flow above minimums
4. Project payoff dates at minimum payments
5. Calculate total interest under current path

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
