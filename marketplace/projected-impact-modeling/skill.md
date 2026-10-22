# Projected Impact Modeling

Project each high-velocity expense 6 and 12 months forward to see where it will be if unchecked.

## Inputs

- `velocity-table`: Monthly growth rates by category
- `acceleration-flags`: Categories with accelerating growth

## Outputs

- `projections`: For each high-velocity category: what the expense will be in 6 and 12 months at the current growth rate
- `budget-breach-dates`: When each high-velocity expense will breach its budget or comfort threshold at the current rate

## Process

1. For each flagged category, calculate: current monthly amount x (1 + monthly growth rate) ^ 6 for the 6-month projection, and ^ 12 for the 12-month projection.
2. Compare the projections against budget limits or comfort thresholds. If a $500/month expense at 10% velocity hits $885 in 6 months and $1,569 in 12 months, is that acceptable?
3. Calculate the budget breach date: the month at which the projected expense exceeds the budget or threshold for that category.
4. The projections often produce alarming numbers because humans are bad at intuiting exponential growth. A 'small' 8% monthly increase doubles the expense in 9 months.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
