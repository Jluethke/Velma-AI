# Break Even Time Calculator

Calculate how long it takes to break even given the expected volume or usage rate over time.

## Inputs

- `break-even-units`: The volume needed to break even
- `expected-volume`: The expected units per month (or per period)

## Outputs

- `break-even-time`: Months or periods until the break-even volume is reached at the expected rate
- `cumulative-cash-flow-curve`: Month-by-month cumulative cash flow showing the initial investment, the deficit period, and the crossover point where cumulative returns exceed cumulative costs

## Process

1. Divide break-even units by expected units per period. This gives the break-even time in periods. If break-even is 500 units and you expect 50 per month, break-even time is 10 months.
2. Build the cumulative cash flow curve: for each month, calculate cumulative costs (fixed costs incurred to date plus variable costs for all units to date) and cumulative revenue (revenue from all units to date). Plot them. The crossover is the visual break-even.
3. Account for the time value of money: if the break-even time exceeds 12 months, discount future cash flows at a reasonable rate (the cost of capital, or the return you'd get from the alternative investment). The discounted break-even time is always longer than the undiscounted time.
4. If the break-even time exceeds the useful life of the investment or the planning horizon, the investment does not break even. This is a stop signal, not just a concern.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
