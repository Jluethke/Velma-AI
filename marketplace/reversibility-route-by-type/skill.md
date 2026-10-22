# Reversibility Route By Type

Route Type 1 decisions to deep analysis and Type 2 decisions to a fast decide-and-adjust path.

## Inputs

- `type-labels`: Each decision labeled Type 1 or Type 2.
- `classification-notes`: Why each decision earned its label.

## Outputs

- `routing-plan`: Which path each decision takes based on its type.
- `analysis-depth`: How much analysis each path gets.

## Process

1. Send each Type 1 decision to a slower path with more review.
2. Send each Type 2 decision to a fast path with a quick owner and deadline.
3. Set how much analysis each path gets so effort matches stakes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
