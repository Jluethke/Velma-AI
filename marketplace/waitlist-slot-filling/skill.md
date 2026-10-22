# Waitlist Slot Filling

Fill the opened slot from the waitlist based on responses.

## Inputs

- `notification-sent`: Notification sent to the waitlist candidate
- `response-window`: The response deadline

## Outputs

- `slot-filled`: Whether the slot was filled and by whom, or moved to the next candidate
- `waitlist-updated`: Updated waitlist with the filled entry removed and positions adjusted

## Process

1. If the candidate accepts within the window, book the slot and remove them from the waitlist.
2. If the candidate declines or does not respond, move to the next eligible person and repeat the offer.
3. If the waitlist is exhausted, release the slot to general availability.
4. Update all waitlist positions and notify remaining waitlisted customers of their new position.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
