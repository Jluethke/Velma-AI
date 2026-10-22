# Surplus Investment Executor

Invest surplus cash according to the investment policy.

## Inputs

- `cash-forecast`: Projected cash surpluses
- `liquidity-gaps`: When surplus cash is available and for how long

## Outputs

- `investment-actions`: Investments placed (money market, T-bills, commercial paper, repos)
- `investment-positions`: Current portfolio with maturities and yields

## Process

1. Identify the surplus amount and duration from the forecast.
2. Select instruments within the investment policy (tenor, credit quality, concentration limits).
3. Execute the investments and record the positions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
