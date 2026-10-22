# Condition Persistence Checker

Check whether the contributing conditions still exist. If they do, the same type of failure can and will happen again, even if the proximate cause is different.

## Inputs

- `condition-map`: Pre-existing conditions that contributed
- `defense-failures`: Barriers that failed

## Outputs

- `persistent-conditions`: Conditions from the map that still exist today, with evidence
- `recurrence-risk`: Assessment of how likely a similar failure is while these conditions persist

## Process

1. For each contributing condition, check: does this condition still exist? (Is the team still understaffed? Is the procedure still ambiguous? Is the tool still unreliable?)
2. For each failed defense, check: has it been repaired? If the alarm was misconfigured, is it now configured correctly?
3. If the conditions persist, a recurrence is likely regardless of whether the specific proximate cause is addressed.
4. Rate the recurrence risk: if most conditions persist and defenses are still weak, risk is high.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
