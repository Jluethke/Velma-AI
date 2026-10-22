# Mdp Decision Namer

Name the single decision this meeting exists to make, phrased so it has a finite set of answers. A meeting called to 'discuss' a topic has no finish line and will not reach one. If you cannot name the decision, the meeting should be an email or should not happen.

## Inputs

- `meeting-request`: Why someone thinks a meeting is needed and the topic on the table
- `attendees`: Who would attend and the role each plays in the decision

## Outputs

- `decision-statement`: The decision to be made, written as a question with a bounded set of answers
- `decision-owner`: The one person accountable for making the call once the room has weighed in

## Process

1. Write the decision as a question: 'Do we ship on the first or delay two weeks?' not 'Let us talk about the timeline.'
2. Confirm the question has a finite answer set. If the answers are open-ended, narrow the question until they are not.
3. Name the single decision owner. A decision owned by the group is owned by no one and will reopen next week.
4. Run the necessity check: if the owner can decide with written input, cancel the meeting and collect the input in writing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
