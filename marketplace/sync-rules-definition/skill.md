# Sync Rules Definition

Define the synchronization rules including direction, conflict resolution, and field mapping.

## Inputs

- `calendar-inventory`: All calendar sources
- `sync-needs`: Sync pairs and directions

## Outputs

- `sync-rules`: Complete sync ruleset (direction, conflict resolution, field mapping, filters)
- `timezone-handling`: Rules for handling timezone differences across calendars

## Process

1. For each sync pair, define the direction (one-way push, one-way pull, bidirectional).
2. Define conflict resolution: if the same time slot has events on both sides, which calendar wins?
3. Define field mapping: which fields copy (title, location, attendees, description) and which are blocked (private notes, internal links).
4. Define timezone handling: store in UTC, display in local, convert on sync.
5. Set filters: which event types sync (meetings yes, all-day reminders no, tentative events as busy blocks).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
