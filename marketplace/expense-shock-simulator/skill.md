# Expense Shock Simulator

Simulate an expense shock: a single unexpected cost equal to 3 times your largest monthly expense. Calculate the reserve impact and recovery timeline.

## Inputs

- `baseline-model`: The baseline financial model

## Outputs

- `expense-shock-result`: Reserve balance after absorbing the shock, whether reserves drop below 1 month of expenses, and the months needed to rebuild reserves to pre-shock level
- `expense-shock-funding-plan`: How to fund the shock: reserves, credit, payment plan, or asset liquidation, with the cost of each option

## Process

1. Calculate the shock amount: 3 times the largest single monthly expense. Examples: a major car repair, a medical event, an equipment failure, or a legal action.
2. Subtract the shock from liquid reserves. If reserves go negative, calculate how much must be funded through credit or other sources. Calculate the interest cost of credit funding over a 12-month repayment period.
3. Calculate the recovery timeline: at the current monthly surplus, how many months to rebuild reserves to the pre-shock level? If the surplus is small, recovery could take years.
4. Evaluate the funding options in order of cost: reserves (free), zero-interest payment plan (cheap), low-rate credit line (moderate), high-rate credit card (expensive), asset liquidation (may be cheap in interest but expensive in lost future value).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
