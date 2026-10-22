# Reschedule Noshow Handler

Handle reschedules, cancellations, and no-shows for client sessions.

## Inputs

- `session-log`: The session history log
- `package-usage`: Current package usage status

## Outputs

- `reschedule-record`: Record of reschedules, cancellations, and no-shows with reasons and outcomes
- `attendance-pattern`: Pattern analysis (frequent cancellations, no-show streaks, preferred reschedule times)

## Process

1. When a reschedule request comes in, check the cancellation policy (within window = free, late = fee or lost session).
2. Offer alternative times within the same week if possible, or the next available slot.
3. For no-shows, follow up with the client (check in, remind of the policy, offer to rebook).
4. Track patterns: if a client frequently cancels a specific day or time, suggest changing the recurring cadence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
