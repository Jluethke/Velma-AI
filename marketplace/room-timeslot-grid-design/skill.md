# Room Timeslot Grid Design

Define the room and time slot grid for the event schedule.

## Inputs

- `session-proposals`: Accepted session proposals
- `speaker-availability`: Speaker availability windows

## Outputs

- `slot-grid`: The time slot grid (rows = time blocks, columns = rooms) with capacity and features per room
- `scheduling-constraints`: Hard constraints (speaker conflicts, room requirements, attendee flow limits)

## Process

1. Define the time blocks for each day (morning sessions, lunch, afternoon sessions, evening).
2. Map the available rooms with capacity, AV equipment, and features.
3. Build the grid: each cell is a room-plus-time-slot that can hold one session.
4. List the hard constraints: no speaker in two sessions at the same time, workshops need specific rooms, keynotes in the main hall.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
