# High Velocity Isolator

Isolate the top 3 highest-velocity expense categories and analyze what is driving the growth in each.

## Inputs

- `velocity-ranking`: Categories ranked by growth rate
- `categorized-expenses`: The underlying transaction data by category

## Outputs

- `top-velocity-categories`: The 3 fastest-growing categories with their growth drivers identified
- `growth-driver-analysis`: For each top category: is the growth driven by more transactions (frequency), larger transactions (amount per transaction), or new payees (scope creep)?

## Process

1. Take the top 3 categories by compound annual growth rate. For each, pull the individual transactions across all months.
2. Decompose the growth into three components: frequency (number of transactions per month trending up?), amount per transaction (average transaction size trending up?), and scope (new payees appearing that weren't present 6 months ago?).
3. Identify the dominant driver. If frequency is the driver, the intervention is to reduce how often you use the category. If amount per transaction, the intervention is to find cheaper alternatives for the same purchases. If scope creep, the intervention is to audit the new additions.
4. For each category, calculate what the spending would be if you held the dominant driver flat at its level from 6 months ago. The difference is the growth you can target.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
