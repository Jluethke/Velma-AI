# Critical Period Identifier

Find the critical period: the time window where most drop-off occurs. This is the intervention point.

## Inputs

- `retention-curve`: The plotted retention curve
- `curve-shape`: The shape classification

## Outputs

- `critical-period`: The time window with the steepest drop-off (e.g., days 3-7 or month 1-2)
- `retention-benchmarks`: The retention rate at key time points (day 1, day 7, day 30) compared to industry benchmarks if available

## Process

1. Calculate the period-over-period drop-off rate. Which period loses the highest percentage of remaining users?
2. The critical period is where the curve drops fastest. If 40% leave in the first week but only 5% per month after that, the first week is the critical period.
3. Compare to benchmarks: for SaaS, day-1 retention above 80% and day-30 above 40% is typical. For consumer apps, day-1 above 40% and day-30 above 15% is typical.
4. The critical period tells you where to focus. Improving retention in the first week is higher leverage than improving it in month 6.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
