# Meeting Follow Through System

Send the decisions and actions within 24 hours. Track action completion. A meeting without follow-through is a social event.

## Inputs

- `decision-capture-template`: The decisions and actions captured during the meeting
- `participants`: The attendees plus anyone who needs to know

## Outputs

- `meeting-notes-template`: The notes format: decisions made, actions assigned (what, who, when), and next meeting date if needed. No transcript of the discussion.
- `action-tracking-setup`: How actions are tracked to completion: the tool, the check-in frequency, and the escalation path for overdue actions

## Process

1. Send the notes within 24 hours. The notes contain only: the decisions made and the actions assigned. They do not contain a transcript of who said what.
2. Each action item is tracked: the owner acknowledges receipt, provides status at the next check-in, and marks complete when done.
3. Overdue actions are escalated: if an action is not completed by its deadline, the meeting organizer follows up within 24 hours. If still not completed after 48 hours, it is escalated to the decision owner.
4. At the start of the next meeting, review the action items from the last meeting. This creates accountability and prevents actions from disappearing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
