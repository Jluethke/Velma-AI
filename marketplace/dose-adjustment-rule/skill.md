# Dose Adjustment Rule

Apply the adjustment rule: increase the dose only when a target is below, and otherwise hold at the minimum that works.

## Inputs

- `result-measurements`: The recorded metrics at the held dose
- `below-target-flag`: Whether each target is at, above, or below

## Outputs

- `dose-adjustment-decision`: For each target, a decision to hold, increase by a small step, or reduce
- `maintained-minimum`: The sustained dose for targets already being met, protected against creeping upward

## Process

1. For any target below its mark, increase the dose by one small step toward or past the minimum, then run another measurement window before increasing again.
2. For any target at its mark, hold the dose. There is no reward for doing more than the dose that already produces the result, and more adds injury and burnout risk.
3. For any target above its mark at a high cost in time or fatigue, consider reducing to the smallest dose that still holds the result.
4. Protect the maintained minimum from drifting upward out of enthusiasm. The method works by finding the floor and staying there, not by always climbing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
