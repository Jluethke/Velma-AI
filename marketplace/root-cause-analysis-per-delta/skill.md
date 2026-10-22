# Root Cause Analysis Per Delta

For each significant delta, ask why. Trace the causal chain until you reach a cause that was within your control.

## Inputs

- `delta-list`: All deltas between plan and actual
- `event-description`: The context of the event

## Outputs

- `root-causes`: For each major delta: the chain of causes from the delta to the root cause, including whether the root cause was controllable
- `controllable-causes`: Root causes that were within the team's control (these are the actionable findings)

## Process

1. Prioritize the deltas by impact. Not every delta needs a root cause analysis. Focus on the top 3-5 deltas (the largest positive and negative differences).
2. For each prioritized delta, ask 'why' repeatedly until you reach a cause that was within your control. 'We shipped late because testing took longer because we found more bugs because the code had more defects because the spec was ambiguous.' The controllable cause is 'the spec was ambiguous.'
3. Separate controllable from uncontrollable causes. An earthquake is uncontrollable. A missing specification is controllable. Focus the lessons on the controllable causes.
4. For positive deltas (things that went better than planned), trace the cause too. Understanding why something went right is as valuable as understanding why something went wrong.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
