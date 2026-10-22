# Reliability Tracking Window

Track the stack over a window long enough to tell whether the trigger fires reliably before any scaling happens.

## Inputs

- `stack-formula`: The stacking formula
- `placement-test-result`: The result of the short trial

## Outputs

- `reliability-tracker`: A daily record of whether the anchor fired and whether the habit followed
- `trigger-firing-rate`: The percentage of days the habit followed the anchor over the window

## Process

1. Track two things each day: did the anchor happen, and did the habit follow. Separating them tells you whether failures come from the anchor or the stack.
2. Run the window for at least two weeks. A trigger needs repetition before it becomes automatic, and a few good days are not proof.
3. Compute the firing rate as the share of days the habit followed the anchor. Treat anything under eighty percent as not yet reliable.
4. If the anchor often fails to happen at all, swap it for a more reliable anchor rather than blaming the new habit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
