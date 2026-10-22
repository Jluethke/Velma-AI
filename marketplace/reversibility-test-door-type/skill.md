# Reversibility Test Door Type

For each decision, test whether it is a one-way door or a two-way door you can walk back through.

## Inputs

- `pending-decisions`: The listed decisions with what each commits you to.
- `decision-notes`: Which decisions are blocking other work.

## Outputs

- `door-test-results`: Whether each decision can be reversed later.
- `undo-cost`: The cost and time to undo each decision.

## Process

1. Ask for each decision whether you could reverse it later and at what cost.
2. Record the cost and time it would take to undo each decision.
3. Separate decisions you could unwind from those you could not.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
