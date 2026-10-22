# Feedback Trigger Identifier

Decide whether an event is worth feedback and how fast it must be delivered. Not every observation needs feedback, but anything that should repeat or should stop does, and it should land within about 48 hours.

## Inputs

- `observed-event`: The event you are considering giving feedback on
- `feedback-goal`: The outcome you care about that the behavior helps or hurts

## Outputs

- `feedback-worthiness`: Whether the event warrants feedback, and whether the intent is to reinforce or to redirect
- `timing-window`: The delivery window, within about 48 hours and in private

## Process

1. Check the event against the goal: does this behavior help or hurt the result you care about?
2. Decide the intent: reinforce a behavior you want repeated, or redirect one you want changed. Both use the same method.
3. If the event is trivial or a one-off with no pattern, let it go rather than diluting your feedback.
4. Set the delivery window within about 48 hours, in private, while both of you remember the specifics.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
