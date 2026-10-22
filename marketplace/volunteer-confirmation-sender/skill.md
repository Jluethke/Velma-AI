# Volunteer Confirmation Sender

Send schedule confirmations and reminders to assigned volunteers.

## Inputs

- `draft-schedule`: The finalized volunteer schedule
- `coverage-gaps`: Any remaining unfilled slots

## Outputs

- `confirmation-log`: Record of confirmations sent and responses received
- `reminder-schedule`: When reminders will be sent before each shift

## Process

1. Send each volunteer their assigned dates and roles with a confirmation request.
2. Track responses: confirmed, declined, no response.
3. For declined or no-response slots, find a substitute from the available roster.
4. Set up automatic reminders (48 hours and 2 hours before each shift).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
