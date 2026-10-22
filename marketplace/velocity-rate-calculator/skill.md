# Velocity Rate Calculator

Calculate the month-over-month growth rate for each expense category and the compound annual growth rate.

## Inputs

- `categorized-expenses`: Monthly totals per category for 6 to 12 months

## Outputs

- `velocity-table`: Each category with its average monthly growth rate, compound annual growth rate, and trend direction (accelerating, stable, decelerating)
- `velocity-ranking`: Categories ranked by absolute growth rate, highest first

## Process

1. For each category, calculate the month-over-month growth rate for each consecutive pair of months: (month_N minus month_N-1) divided by month_N-1.
2. Calculate the average monthly growth rate (arithmetic mean of the individual monthly rates). Then calculate the compound annual growth rate: (1 + average monthly rate) raised to the 12th power, minus 1.
3. Determine the trend direction: if the most recent 3 monthly growth rates are increasing, the category is accelerating. If decreasing, it's decelerating. Otherwise, stable.
4. Rank all categories by absolute compound annual growth rate. A category growing at 15% annually is a higher priority than one growing at 3%, regardless of which costs more in absolute terms right now.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
