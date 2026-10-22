# Lagging Indicator Collector

Collect the lagging indicators for each manager: team voluntary turnover rate (last 12 months), team performance distribution (from the calibrated ratings), and team promotion rate (promotions in the last 24 months as a percentage of team size). These tell you what already happened.

## Inputs

- `manager-list`: The managers being assessed
- `hr-data-access`: Access to turnover, performance rating, and promotion data by team

## Outputs

- `lagging-indicators`: For each manager: voluntary turnover rate, team performance distribution, and promotion rate, compared against the company median
- `lagging-outliers`: Managers in the bottom or top quartile on any lagging indicator

## Process

1. For each manager, calculate: voluntary turnover rate (voluntary departures from their team in the last 12 months divided by average team size).
2. Calculate the team performance distribution: what percentage of their team is at each rating level? Compare against the company distribution.
3. Calculate the promotion rate: team members promoted in the last 24 months divided by average team size.
4. Compare each manager's lagging indicators against the company median. Flag those in the bottom quartile on any indicator.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
