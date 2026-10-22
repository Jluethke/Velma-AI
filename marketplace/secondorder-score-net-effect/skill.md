# Secondorder Score Net Effect

Net the orders together and surface cases where a first-order good hides a third-order harm.

## Inputs

- `weighted-effects`: Each branch carrying the odds of reaching it.
- `likely-branches`: The branches that are both likely and heavy in effect.

## Outputs

- `net-score`: The weighted good and bad effects summed across all orders.
- `hidden-costs`: The costs that only appear past the first order.

## Process

1. Add the weighted good and bad effects across all orders for each option.
2. Flag any option whose first-order looks good but whose later orders are bad.
3. Record the hidden costs that only appear past the first order.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
