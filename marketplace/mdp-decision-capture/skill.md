# Mdp Decision Capture

Capture the decision live, in the room, before anyone leaves. State what was decided, who owns each action, and the date each is due, and read it back aloud. Memory starts editing the decision the moment the meeting ends, so capture beats recall.

## Inputs

- `meeting-agenda`: The sequence that led to the decision
- `decision-owner`: The person making the final call

## Outputs

- `decision-record`: What was decided, by whom, and with what caveats, confirmed aloud before anyone leaves
- `action-owners`: Each follow-up action with a single named owner and a due date

## Process

1. State the decision aloud and write it down as spoken: 'We decided to ship on the first. The owner is accountable for the release.'
2. Assign each action to one person. An action owned by a team is owned by no one.
3. Attach a due date to every action. An action with no date competes with everything else and loses.
4. Read the record back and ask for correction now. Confusion caught in the room is free. Confusion caught next week is expensive.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
