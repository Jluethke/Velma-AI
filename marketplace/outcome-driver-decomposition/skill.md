# Outcome Driver Decomposition

Decompose the outcome into the behaviors and activities that produce it. Revenue is produced by deals closed. Deals closed is produced by proposals sent. Proposals sent is produced by discovery calls completed. Each layer is closer to something you can influence daily.

## Inputs

- `defined-outcome`: The specific outcome with number and deadline
- `lagging-metric`: The metric that measures the outcome directly

## Outputs

- `driver-tree`: A tree of activities, from the outcome at the root down to the daily behaviors at the leaves
- `driver-levels`: The number of levels between the outcome and the most actionable daily behavior

## Process

1. Ask: what directly produces this outcome? Write that as the first driver. Then ask: what directly produces THAT driver? Repeat until you reach something a person does on a specific day.
2. At each level, check the causal direction. 'More discovery calls' causes 'more proposals sent' causes 'more deals closed' causes 'more revenue.' If the causal arrow is uncertain, mark it.
3. Stop decomposing when you reach a behavior that a single person can do in a single day. That is the leaf of the tree.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
