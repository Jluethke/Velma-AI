# Icd True Cost Ranker

Rank the options by true cost against the sticker price.

## Inputs

- `true-cost-table`: The full true cost per option
- `visible-cost-table`: The sticker prices to compare against

## Outputs

- `cost-ranking`: The options ranked by true total cost
- `sticker-gap-table`: The gap between each sticker price and its true cost

## Process

1. Rank the options by their true total cost.
2. Compare each true cost against its sticker price.
3. Flag the options whose true cost far exceeds the sticker.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
