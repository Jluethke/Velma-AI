# Constraint Hour Tracking System

Set up ongoing tracking so you continuously monitor revenue per constraint hour and catch misallocation early.

## Inputs

- `adjusted-revenue-per-hour`: The current state after optimization
- `constraint-resource`: The resource being tracked

## Outputs

- `tracking-system`: How to track constraint hours per product/client on an ongoing basis (weekly or monthly)
- `rebalance-triggers`: Thresholds that trigger a reallocation review (e.g., any new client consuming more than 20% of constraint hours at below-average revenue per hour)

## Process

1. Set up weekly time tracking for the constraint resource, categorized by product or client. This takes 5 minutes per day but provides the data for continuous optimization.
2. Calculate revenue per constraint hour monthly. Plot it over time. A declining trend means new work is lower-value, or existing work is consuming more constraint time.
3. Define triggers: if any single product or client drops below 50% of the average revenue per constraint hour, flag it for review.
4. Review the full table quarterly. The market changes, clients evolve, and new opportunities appear. The ranking should be re-evaluated regularly.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
