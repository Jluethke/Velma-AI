# Nas Concession Planner

Plan the concession path from anchor to target.

## Inputs

- `anchor-value`: The opening anchor
- `walk-away-point`: The floor the ladder stops at

## Outputs

- `concession-ladder`: A sequence of shrinking concessions from anchor to target
- `trade-list`: Non-price trades to offer in place of price movement

## Process

1. Plan a sequence of shrinking concessions from the anchor toward the target.
2. Stop the ladder at the walk-away point.
3. List non-price trades to offer in place of movement on price.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
