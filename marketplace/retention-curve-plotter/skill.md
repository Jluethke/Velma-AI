# Retention Curve Plotter

Plot the retention curve: percentage of users or customers remaining at each time period after their start date.

## Inputs

- `user-data`: User activity data with start dates and activity timestamps
- `retention-definition`: What counts as retained (logged in, purchased, attended, continued a habit)

## Outputs

- `retention-curve`: The curve: percentage retained at each time period (day 1, day 7, day 30, day 90, day 180, day 365)
- `curve-shape`: The shape classification: flattening (good), declining to zero (leaky bucket), or improving over time (ideal)

## Process

1. Define retention: what action indicates the person is still active? Log in, make a purchase, attend, exercise, use the feature.
2. For each time period, calculate the percentage of the starting cohort that is still retained.
3. Plot the curve. Look at the shape, not just the final number.
4. Classify: does it flatten (a stable base of retained users), decline to zero (everyone eventually leaves), or improve (users who stay get more engaged over time)?

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
