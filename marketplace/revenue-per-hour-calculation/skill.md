# Revenue Per Hour Calculation

Calculate the revenue per constraint hour for every product, service, or client.

## Inputs

- `constraint-resource`: The identified bottleneck resource
- `constraint-capacity`: Available hours per week

## Outputs

- `revenue-per-hour-table`: Every product, service, or client ranked by revenue generated per hour of the constraint resource consumed
- `total-revenue-capacity`: Maximum possible weekly revenue if all constraint hours were allocated to the highest-revenue work

## Process

1. For each product, service, or client, calculate: total revenue divided by total constraint hours consumed. A $10,000 project that takes 20 hours of constraint time generates $500/constraint-hour. A $5,000 project that takes 5 hours generates $1,000/constraint-hour.
2. Rank from highest to lowest revenue per constraint hour.
3. Calculate theoretical maximum: if all available constraint hours were allocated to the highest-ranked item, what would total revenue be? This is your ceiling.
4. The gap between your theoretical maximum and your actual revenue is the cost of misallocation. You are spending constraint time on lower-value work when higher-value work exists.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
