# Slot Opening Notification

Notify the next person on the waitlist when a slot opens up.

## Inputs

- `waitlist-entry`: The waitlist entries for the opened slot
- `current-availability`: Updated availability showing the opened slot

## Outputs

- `notification-sent`: Notification sent to the next eligible person with response deadline
- `response-window`: The expiration window for the offer (e.g., 4 hours to respond)

## Process

1. Detect the slot opening (cancellation, schedule extension, new provider added).
2. Identify the next person on the waitlist whose desired range matches the opened slot.
3. Send a notification via their preferred channel (SMS, email, app notification) with the slot details.
4. Set a response deadline (e.g., respond within 4 hours or the offer moves to the next person).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
