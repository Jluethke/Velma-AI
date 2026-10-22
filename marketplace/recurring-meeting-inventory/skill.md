# Recurring Meeting Inventory

List every recurring meeting and compute the real time it costs across all attendees. The cost of a weekly hour-long meeting for eight people is a surprising amount of time per year, and seeing it changes the conversation.

## Inputs

- `meeting-calendar`: The calendar of recurring meetings
- `team-scope`: The team or group whose meetings are in scope

## Outputs

- `meeting-list`: Every recurring meeting in scope
- `meeting-time-cost`: Total attendee time each meeting consumes per year

## Process

1. List every recurring meeting on the team's calendars.
2. For each, multiply duration by frequency by number of attendees to get annual attendee hours.
3. Include preparation and follow-up time, not just the scheduled block.
4. Rank meetings by total time cost so the expensive ones get the most scrutiny.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
