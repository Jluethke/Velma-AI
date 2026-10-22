# Secondorder Weight By Probability

Assign a rough probability to each branch so unlikely chains do not carry equal weight.

## Inputs

- `third-order-effects`: The effects at the end of each chain.
- `order-chain`: The full chain from decision to third-order result.

## Outputs

- `weighted-effects`: Each branch carrying the odds of reaching it.
- `likely-branches`: The branches that are both likely and heavy in effect.

## Process

1. Give each branch of effects a rough probability on a shared scale.
2. Multiply along each chain so later effects carry the odds of getting there.
3. Mark the branches that are both likely and heavy in effect.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
