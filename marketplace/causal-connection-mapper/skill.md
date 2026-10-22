# Causal Connection Mapper

Map the causal connections between the behavior changes: which ones cause or enable others.

## Inputs

- `change-list`: All desired behavior changes
- `importance-ratings`: Importance of each change

## Outputs

- `causal-map`: A directed graph showing which behaviors cause or enable other behaviors (A leads to B means adopting A makes B easier or more likely)
- `upstream-counts`: For each behavior, how many other behaviors it sits upstream of (directly or indirectly)

## Process

1. For each pair of behaviors on the list, ask: does adopting behavior A make behavior B easier, more likely, or automatic? If yes, draw an arrow from A to B.
2. Example: 'exercise daily' leads to 'sleep better' (exercise improves sleep quality), which leads to 'wake up earlier' (better sleep means easier mornings), which leads to 'have a morning routine' (waking earlier creates time).
3. Count the upstream connections for each behavior. A behavior with 5 downstream connections is more upstream than one with 1.
4. Look for behaviors that appear upstream of multiple independent chains. These are keystone habit candidates.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
