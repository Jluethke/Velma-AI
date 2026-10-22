# Model Comparator

Apply multiple attribution models and compare. Different models give different answers.

## Inputs

- `touchpoint-sequences`: The conversion paths
- `decision-to-inform`: What decision this attribution drives

## Outputs

- `model-comparison`: Same data under 4 models (first-touch, last-touch, linear, time-decay) with credit distribution
- `selected-model`: The model that best fits the decision, with reasoning

## Process

1. First-touch: all credit to first touchpoint. Best for awareness investment decisions.
2. Last-touch: all credit to last touchpoint. Best for closing investment decisions.
3. Linear: equal credit to all. Best for understanding the full journey.
4. Time-decay: more credit to recent touchpoints. Best for overall budget allocation.
5. Select based on the decision: awareness = first-touch, closing = last-touch, budget = time-decay.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
