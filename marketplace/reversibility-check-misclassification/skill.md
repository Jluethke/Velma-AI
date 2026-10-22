# Reversibility Check Misclassification

Catch the common error of treating a reversible decision as if it were irreversible.

## Inputs

- `routing-plan`: Which path each decision takes based on its type.
- `analysis-depth`: How much analysis each path gets.

## Outputs

- `corrected-labels`: Over-labeled decisions moved to the fast path.
- `speed-gains`: The time saved by not over-analyzing reversible choices.

## Process

1. Review the Type 1 pile for decisions that are actually reversible.
2. Move any over-labeled decision to the Type 2 fast path.
3. Record the time saved by not over-analyzing reversible choices.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
