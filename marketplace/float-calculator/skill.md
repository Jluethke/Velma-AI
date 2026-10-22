# Float Calculator

Calculate the float: money that is yours but not yet needed, and the duration of each float window.

## Inputs

- `daily-balance-curve`: Running balance for each day of the month
- `valley-days`: Days where balance hits minimum

## Outputs

- `float-windows`: Periods where excess cash sits idle, with the amount and duration of each window
- `total-float-days`: Total dollar-days of float available per month (amount times days idle)

## Process

1. Define the minimum operating balance: the highest valley balance plus a 10% buffer. Any balance above this line is float.
2. For each day, calculate the excess above the minimum operating balance. Group consecutive days of excess into float windows.
3. For each float window, calculate dollar-days: the average excess amount times the number of days in the window. This measures how much money sits idle for how long.
4. Rank the float windows by dollar-days. The largest window is where you have the most opportunity to put money to work (high-yield savings, short-term investments, or accelerated debt payoff).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
