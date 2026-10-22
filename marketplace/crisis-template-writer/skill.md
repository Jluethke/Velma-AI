# Crisis Template Writer

Write the communication templates for each scenario and audience combination. Templates follow the AIAF pattern: Acknowledge, Inform, Act, Follow up.

## Inputs

- `crisis-scenarios`: The defined scenarios with severities and audiences
- `response-time-targets`: The timing targets

## Outputs

- `crisis-templates`: Pre-written templates for each scenario/audience combination: the AIAF structure with fill-in-the-blank specifics
- `do-not-say-list`: Phrases and commitments to avoid in crisis communication: speculation, blame, promises about timeline, minimization

## Process

1. For each template, use the AIAF structure. Acknowledge: 'We are aware of [specific issue].' Inform: 'Here is what we know so far: [facts only, no speculation].' Act: 'Here is what we are doing: [specific actions].' Follow up: 'We will provide the next update by [specific time].'
2. Write the templates with blanks for specifics. The structure stays the same; the details change. 'We are aware of [describe the issue]. As of [time], we know [confirmed facts]. We are [actions being taken]. We will update you by [next update time].'
3. Build the do-not-say list: never speculate ('We believe the cause might be...'), never blame ('This was caused by a vendor error'), never minimize ('Only a small number of users were affected' when you do not know the scope yet), never promise a timeline you cannot keep.
4. Create audience-specific versions: customers get impact and resolution timeline. Employees get internal actions and their role. Media gets a brief factual statement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
