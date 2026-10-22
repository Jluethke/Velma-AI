# Onboarding Measurement System

Set up measurement to track onboarding performance over time: completion rate, time to first value, and drop-off points.

## Inputs

- `redesigned-flow`: The new flow
- `first-value-design`: The value moment

## Outputs

- `onboarding-metrics`: The metrics to track: completion rate per step, time to first value (median), drop-off rate per step, and first-week retention by onboarding cohort
- `improvement-triggers`: Thresholds that trigger investigation: any step with more than 20% drop-off, time to first value above 5 minutes, first-week retention below target

## Process

1. Instrument every step in the onboarding flow: track how many users reach each step, how long they spend, and how many drop off.
2. Track the funnel: what percentage of signups reach first value? This is the most important onboarding metric. Everything else is diagnostic.
3. Set thresholds for investigation: any step where more than 20% of users drop off needs attention. Any step taking more than 60 seconds needs simplification.
4. Review monthly. Onboarding performance can degrade as the product changes (new features add complexity, new user segments have different expectations).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
