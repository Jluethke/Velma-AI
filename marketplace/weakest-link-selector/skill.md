# Weakest Link Selector

Identify the weakest skill in the chosen stack, since raising it lifts the whole stack.

## Inputs

- `market-matched-combinations`: Combinations matched to the needs they could serve
- `fit-rationale`: The reasoning behind the chosen combination

## Outputs

- `priority-skill`: The weakest skill in the chosen stack to improve first
- `improvement-targets`: Specific targets that define better for that skill

## Process

1. Compare the skills inside the chosen combination by current percentile.
2. Select the weakest skill, since raising it lifts the whole stack.
3. Define specific improvement targets for that skill.
4. Confirm the targets are observable and checkable.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
