# Deal Velocity Tracker

Track deal progression speed and identify stuck deals.

## Inputs

- `stage-definitions`: Pipeline stages and criteria
- `deal-list`: Current deals with stage and age

## Outputs

- `velocity-metrics`: Average days per stage and conversion rates
- `stuck-deals`: Deals exceeding stage time thresholds

## Process

1. Calculate average time in each stage across all deals.
2. Flag deals that exceed 1.5x the average stage duration.
3. Compute stage-to-stage conversion rates.
4. Rank stuck deals by value and age.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
