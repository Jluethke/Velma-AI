# Cash Position Forecaster

Forecast the cash position based on expected inflows and outflows.

## Inputs

- `bank-account-balances`: Current balances across all accounts
- `expected-cash-flows`: Scheduled inflows (receivables, revenue) and outflows (payables, payroll, debt service)

## Outputs

- `cash-forecast`: Daily and weekly cash position forecast
- `liquidity-gaps`: Periods where cash is projected below minimum or above investment threshold

## Process

1. Aggregate current balances across all bank accounts.
2. Map expected inflows and outflows by date.
3. Project the daily cash position and identify surplus or deficit periods.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
