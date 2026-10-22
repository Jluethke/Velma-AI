# Leading Indicator Collector

Collect the leading indicators for each manager: 1:1 frequency and consistency, team engagement survey scores, time-to-fill for open roles on their team, and skip-level feedback (what their direct reports say about them to their manager's manager). These predict what will happen in 6-12 months.

## Inputs

- `lagging-indicators`: Historical output data by manager
- `lagging-outliers`: Managers flagged by lagging data

## Outputs

- `leading-indicators`: For each manager: 1:1 frequency, engagement scores, time-to-fill, and skip-level feedback summary
- `leading-outliers`: Managers in the bottom or top quartile on any leading indicator

## Process

1. For 1:1s: check the calendar data. How many scheduled 1:1s did the manager actually hold in the last quarter (not canceled or rescheduled)? Consistency matters more than frequency.
2. For engagement: if a pulse survey or annual survey exists, pull the results for each manager's team.
3. For time-to-fill: how long does it take to fill an open role on this manager's team? Long time-to-fill signals that the team's reputation is poor or the manager is not engaged in hiring.
4. For skip-level: summarize what each manager's direct reports say in skip-level conversations. If skip-level conversations are not happening, that is itself a leading indicator (the manager's manager is not checking).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
