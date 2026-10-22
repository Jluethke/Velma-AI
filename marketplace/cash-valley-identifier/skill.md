# Cash Valley Identifier

Simulate the daily running balance across a month to find the valley days where the balance hits its minimum.

## Inputs

- `daily-flow-calendar`: Inflows and outflows mapped to their day of month
- `starting-balance`: The balance on day 1 of the month

## Outputs

- `daily-balance-curve`: Running balance for each day of the month
- `valley-days`: The days where balance hits a local minimum, ranked by depth

## Process

1. Start with the opening balance. For each day 1 through 31, add all inflows and subtract all outflows for that day. Record the running balance.
2. Identify every local minimum: a day where the balance is lower than both the day before and the day after. These are valley days.
3. Calculate the valley depth: the difference between the balance on the valley day and the nearest preceding peak. Deeper valleys are higher risk.
4. Flag any valley that drops below a safety threshold (for personal: one week of essential expenses; for business: one payroll cycle).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
