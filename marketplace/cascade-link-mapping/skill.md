# Cascade Link Mapping

Map which of the five changes make the others easier, so you can see the causal structure instead of treating the five as independent.

## Inputs

- `five-candidate-changes`: The five concrete behavior changes
- `change-effort-notes`: Past sustain history for each change

## Outputs

- `cascade-link-map`: A directed map where an arrow from A to B means doing A makes B easier or more automatic
- `downstream-count-per-change`: For each change, how many of the other four it sits upstream of

## Process

1. Take each pair of changes and ask one question: if I did the first consistently, would the second get easier, more likely, or more automatic? If yes, draw an arrow from the first to the second.
2. Trace the known physiological chains. Regular movement tends to improve sleep quality, better sleep tends to steady appetite and food choices, and steadier eating tends to lift mood and energy.
3. Count the outgoing arrows for each change. A change with three arrows out sits upstream of three other changes and is a cascade candidate.
4. Flag any change with zero outgoing arrows. It may still be worth doing, but it will not pull the others along and is not a keystone.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
