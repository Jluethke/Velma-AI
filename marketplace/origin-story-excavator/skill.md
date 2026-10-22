# Origin Story Excavator

For each item in the inventory, find why it was created. Every process exists for a reason, but the reason may no longer apply. A weekly status meeting was created because two teams were not communicating. Are they still not communicating, or has Slack replaced the meeting? An approval chain was created after a costly mistake. Has the underlying system been fixed?

## Inputs

- `process-inventory`: All recurring processes, approvals, meetings, and roles
- `team-suspicion-list`: Items suspected of adding no value

## Outputs

- `origin-stories`: For each item: why it was created, when, by whom, and what problem it was solving
- `still-valid-flags`: For each item: whether the original reason still applies (yes, partially, or no)

## Process

1. For each item, ask the longest-tenured team member: Why do we do this? When did it start? What problem was it solving?
2. If nobody remembers why a process exists, that is itself a signal. A process whose purpose is forgotten is likely debt.
3. For each item with a known origin, assess: does the original problem still exist? If the process was created because of a specific incident, has the underlying cause been fixed?
4. Mark each item: still valid (the original reason fully applies), partially valid (the reason partially applies but the process is heavier than needed), or no longer valid (the reason no longer applies).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
