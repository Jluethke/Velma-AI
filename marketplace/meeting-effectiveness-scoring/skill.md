# Meeting Effectiveness Scoring

Score each recurring meeting on necessity and effectiveness.

## Inputs

- `meeting-inventory`: The inventory of recurring meetings
- `time-commitment`: Hours per week in recurring meetings

## Outputs

- `meeting-scores`: Each meeting scored on necessity (1-5) and effectiveness (1-5) with rationale
- `low-value-meetings`: Meetings scoring below threshold on necessity or effectiveness

## Process

1. For each meeting, score necessity (1-5): does a decision or handoff depend on this meeting happening synchronously?
2. Score effectiveness (1-5): does the meeting consistently produce its intended output (decisions, updates, alignment)?
3. Survey attendees (optional) for their perception of value and whether they need to attend.
4. Flag meetings scoring below 3 on either dimension as candidates for change.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
