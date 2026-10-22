# Reversibility Classify Type

Label each decision Type 1, irreversible and high stakes, or Type 2, reversible and low stakes.

## Inputs

- `door-test-results`: Whether each decision can be reversed later.
- `undo-cost`: The cost and time to undo each decision.

## Outputs

- `type-labels`: Each decision labeled Type 1 or Type 2.
- `classification-notes`: Why each decision earned its label.

## Process

1. Label a decision Type 1 when reversing it would be very costly or impossible.
2. Label a decision Type 2 when it can be reversed at low cost.
3. Write why each decision earned its label.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
