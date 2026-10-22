# Booking Notification Setup

Configure the automated notifications sent before, during, and after the booking lifecycle.

## Inputs

- `booking-page-config`: The booking page configuration
- `intake-form-fields`: Fields collected from the customer

## Outputs

- `notification-templates`: Templates for confirmation, reminder, follow-up, and cancellation notifications
- `notification-schedule`: Timing rules for each notification (e.g., reminder 24h before, follow-up 1 day after)

## Process

1. Write the confirmation notification sent immediately after booking (include date, time, location, prep instructions).
2. Write the reminder notification(s) sent before the appointment (e.g., 24 hours and 1 hour before).
3. Write the follow-up notification sent after the appointment (thank you, feedback request, rebooking link).
4. Write the cancellation and reschedule notifications.
5. Define the delivery channel for each (email, SMS, or both) and the send timing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
