# Five Whys Root Cause Analysis

Apply the 5 Whys to each key decision point. Surface the systemic root cause, not the proximate error.

## Inputs

- `event-timeline`: The factual timeline
- `decision-points`: The key decision points to analyze

## Outputs

- `root-cause-chains`: For each key decision point: the 5 Whys chain from the proximate cause to the systemic root cause
- `systemic-root-causes`: The 1-3 systemic root causes that, if fixed, would prevent recurrence across similar situations

## Process

1. For each decision point, ask 'Why did this happen?' five times. Each answer should reference a systemic factor (process, tool, incentive, information flow), not a personal failing.
2. If a 'Why' answer is 'because [person] made a mistake,' ask: 'Why was it possible for a reasonable person to make that mistake in this system?' The answer reveals the systemic gap.
3. Group the root causes: often multiple decision points trace back to the same 1-3 systemic root causes. These are the high-leverage fix points.
4. Common systemic root causes: missing information (the decision-maker did not have the data), missing process (there was no step to catch this), misaligned incentives (the system rewarded the wrong behavior), inadequate tools (the tool made the error easy and the correct action hard).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
