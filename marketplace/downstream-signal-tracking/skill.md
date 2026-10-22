# Downstream Signal Tracking

Track the downstream behaviors without trying to change them, so you can tell whether the keystone is doing the work.

## Inputs

- `keystone-start-plan`: The thirty-day keystone plan
- `cascade-link-map`: The expected downstream behaviors

## Outputs

- `downstream-signal-tracker`: A simple daily log of the keystone plus the downstream behaviors you are not actively changing
- `cascade-check-dates`: The dates at day fifteen and day thirty when you will read the tracker for cascade effects

## Process

1. Log the keystone each day as done or not done. Keep the record binary so it takes seconds and you never skip logging.
2. Alongside it, note the downstream behaviors from the map, such as hours slept or servings of vegetables, as plain observations. Do not try to improve them.
3. Set two read dates, day fifteen and day thirty. Reading the log daily invites tinkering. Reading it on fixed dates keeps the test clean.
4. Record energy or mood in one word each evening. Mood often shifts before the measurable behaviors do and is an early cascade signal.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
