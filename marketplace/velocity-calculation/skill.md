# Velocity Calculation

Calculate the velocity (monthly growth rate) of each expense category.

## Inputs

- `expense-time-series`: Monthly data by category
- `category-totals`: Totals per category

## Outputs

- `velocity-table`: Each category's average monthly growth rate (velocity) and its current monthly level
- `acceleration-flags`: Categories where velocity is increasing (the growth is accelerating, not just steady)

## Process

1. For each category, calculate the average monthly growth rate: (most recent month / earliest month) ^ (1 / number of months) - 1.
2. A positive velocity means the expense is growing. A negative velocity means it is shrinking. Zero means it is flat.
3. Flag any category with velocity above 5% per month. At 5% per month, an expense doubles in about 14 months.
4. Check for acceleration: is the velocity itself increasing? Compare the growth rate of the first half of the period to the second half. Accelerating expenses are more dangerous than steady-growth ones.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
