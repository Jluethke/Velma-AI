# Session Slot Assignment

Assign sessions to rooms and time slots, respecting all constraints.

## Inputs

- `slot-grid`: The room and time slot grid
- `scheduling-constraints`: Hard constraints for session placement

## Outputs

- `draft-event-schedule`: Draft schedule with each session assigned to a room and time slot
- `assignment-conflicts`: Any unresolved conflicts or suboptimal placements

## Process

1. Place keynotes and fixed-time sessions first (opening, closing, sponsored slots).
2. Assign remaining sessions by priority: speaker availability narrows options, room requirements filter further, topic clustering fills the rest.
3. Check for speaker conflicts (same speaker in overlapping slots) and attendee flow issues (popular sessions back-to-back in distant rooms).
4. Identify and resolve conflicts by swapping slots or adjusting room assignments.
5. Produce the draft schedule for review.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
