# Priority Rank Allocator

Allocate funds in priority order until the pool is exhausted. The last funded category is the marginal allocation. Everything below it is unfunded.

## Inputs

- `justified-requests`: The ranked spending requests
- `total-available`: The discretionary pool

## Outputs

- `funded-categories`: Each funded category with its allocated amount and the running total
- `unfunded-categories`: Categories that did not make the cut, with the amount they requested
- `marginal-allocation`: The last funded category: the one at the boundary between funded and unfunded

## Process

1. Starting with the highest-ROI category, allocate its requested amount. Subtract from the pool. Move to the next category.
2. Continue until the pool is exhausted. The last category that fits is the marginal allocation. Everything below it is unfunded for this period.
3. If a category's full request does not fit, consider partial funding: can the category produce a proportional return at a reduced level?
4. The unfunded list is not waste. It is the waiting list. If any funded category underperforms, the top unfunded category gets its allocation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
