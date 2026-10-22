# Mdp Minutes Dispatcher

Turn the decision record into minutes and send them within the hour. Minutes are the decision, the owners, and the dates, not a transcript of the discussion. Sent within the hour, they close the loop before anyone's memory diverges.

## Inputs

- `decision-record`: What was decided and confirmed in the room
- `action-owners`: The actions, owners, and due dates

## Outputs

- `meeting-minutes`: Short minutes stating the decision, the owners, and the dates, sent within one hour
- `dispatch-checklist`: Who receives the minutes, where they are stored, and when the first action check happens

## Process

1. Write the minutes as decision, owners, dates. Leave out the back-and-forth. People want to know what was decided, not who said what.
2. Send within one hour. The value of minutes decays fast, and a next-day send invites 'that is not what I agreed to.'
3. List recipients: everyone who was in the room plus anyone accountable for a downstream action.
4. Store the minutes where the next meeting can find them, and set the date of the first action check so follow-through is scheduled, not hoped for.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
