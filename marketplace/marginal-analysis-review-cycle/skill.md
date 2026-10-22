# Marginal Analysis Review Cycle

Re-run the marginal analysis periodically because marginal returns shift as spending levels change.

## Inputs

- `reallocation-plan`: The reallocation that was implemented
- `spending-table`: The spending categories

## Outputs

- `updated-marginal-returns`: New marginal return estimates after the reallocation has been in effect for one period
- `next-reallocation`: Whether further reallocation is needed or the current allocation is near-optimal

## Process

1. After one period with the new allocation, re-estimate marginal returns. The categories you added funding to now have more spending, so their marginal returns may have decreased. The categories you cut from may now have higher marginal returns.
2. The goal is equilibrium: all categories have roughly equal marginal returns. At equilibrium, there is no reallocation that would improve total returns.
3. Perfect equilibrium is not achievable, but each reallocation cycle should move closer to it.
4. Run this analysis quarterly. The marginal returns shift as market conditions, product offerings, and life circumstances change.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
