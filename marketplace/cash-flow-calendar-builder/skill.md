# Cash Flow Calendar Builder

Map every expected inflow and outflow to a calendar. Daily resolution for the next 90 days, weekly for the next 6 months, monthly for the next year.

## Inputs

- `income-sources`: All sources of inflow with amounts, frequency, and typical timing (e.g., client pays on net-30, salary hits on the 15th and 30th)
- `expense-obligations`: All outflows with amounts, frequency, and due dates

## Outputs

- `cash-flow-calendar`: A day-by-day projection of the bank balance: starting balance, plus inflows, minus outflows, equals ending balance for each day
- `negative-balance-days`: Any day where the projected balance goes below zero or below the minimum reserve threshold

## Process

1. List every inflow: when does it typically arrive (not when it is invoiced, but when the cash hits the account)? Account for payment delays. If a client is on net-30 terms but historically pays on day 45, use day 45.
2. List every outflow: when is it due, and when does it actually leave the account (auto-pay dates, check clearing delays)?
3. Build the calendar: starting balance on day 1, add inflows, subtract outflows, calculate the running balance for each day.
4. Mark the days where the balance drops below zero or below the minimum reserve. These are the cash flow gaps that need to be addressed.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
