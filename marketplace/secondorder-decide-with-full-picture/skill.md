# Secondorder Decide With Full Picture

Make the call using the full map of effects rather than the first-order result alone.

## Inputs

- `net-score`: The weighted good and bad effects summed across all orders.
- `hidden-costs`: The costs that only appear past the first order.

## Outputs

- `decision-call`: The option chosen with later orders in view.
- `decision-rationale`: The chain of effects behind the call, on record.

## Process

1. Compare the options by their net score across all orders.
2. Choose the option whose later-order effects you are willing to live with.
3. Write the rationale so the chain of effects behind the call is on record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
