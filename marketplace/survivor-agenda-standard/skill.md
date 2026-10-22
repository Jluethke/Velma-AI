# Survivor Agenda Standard

Require every surviving meeting to publish an agenda a day ahead or be cancelled for that occurrence. The agenda forces a reason to meet and lets attendees arrive ready instead of discovering the topic in the room.

## Inputs

- `decision-tagged-meetings`: Meetings that survived the decision test

## Outputs

- `agenda-standard`: The rule requiring an agenda ahead of each meeting
- `agenda-template`: A template listing the decisions each meeting will make

## Process

1. Set the rule that a meeting without a published agenda a day ahead is cancelled for that occurrence.
2. Build an agenda template framed around the decisions to be made, not topics to be discussed.
3. Require each agenda item to name the decision and the input needed to make it.
4. Make the no-agenda-no-meeting rule automatic so it does not depend on anyone policing it.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
