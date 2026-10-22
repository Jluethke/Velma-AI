# Decision Dependency Test

Test each meeting by asking what decision would not get made without it. A meeting that enables a real recurring decision survives; one that only shares information that could be read fails the test.

## Inputs

- `meeting-list`: Every recurring meeting
- `meeting-time-cost`: Time cost per meeting

## Outputs

- `decision-tagged-meetings`: Meetings tied to a recurring decision
- `no-decision-meetings`: Meetings that enable no decision

## Process

1. For each meeting, name the specific decision that would not happen if it were cancelled.
2. Tag the meeting as decision-bearing only when that decision is real and recurring.
3. Tag meetings that only broadcast status or information as no-decision meetings.
4. Treat a meeting whose decision could be made asynchronously as a no-decision meeting.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
