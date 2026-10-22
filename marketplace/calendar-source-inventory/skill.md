# Calendar Source Inventory

Inventory all calendar sources that need to be synchronized.

## Inputs

- `user-or-team`: The person or team whose calendars need syncing
- `current-tools`: The calendar and scheduling tools currently in use

## Outputs

- `calendar-inventory`: List of all calendar sources with platform, purpose, and owner
- `sync-needs`: Which calendars need to share data and in what direction

## Process

1. List every calendar the user or team touches (personal Google/Outlook, work calendar, booking system, project management, shared team calendars).
2. For each calendar, note the platform, owner, primary purpose, and whether it is the source of truth for any event type.
3. Identify which pairs of calendars need to sync and whether the sync is one-way or bidirectional.
4. Note any calendars that must remain private (show busy/free only, not event details).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
