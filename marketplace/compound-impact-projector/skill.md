# Compound Impact Projector

Project what happens if each high-velocity category continues at its current rate for 1, 3, and 5 years.

## Inputs

- `top-velocity-categories`: The 3 fastest-growing categories with current monthly amounts and growth rates

## Outputs

- `forward-projections`: For each high-velocity category: projected monthly cost at 1, 3, and 5 years at the current growth rate
- `total-cost-impact`: The cumulative additional spend over 1, 3, and 5 years compared to holding each category flat at today's level

## Process

1. For each high-velocity category, apply the compound growth formula: current monthly amount times (1 + monthly growth rate) raised to the power of N months.
2. Calculate the projected monthly cost at 12 months, 36 months, and 60 months. Show the dollar amount, not just the percentage, because a 20% growth rate on $50/month is different from 20% on $5,000/month.
3. Calculate the cumulative additional cost: sum the monthly differences between the projected amounts and today's flat amount over each time horizon. This is how much extra you will spend if you do nothing.
4. Rank the three categories by cumulative 5-year additional cost. The category with the highest cumulative impact is your priority intervention target.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
