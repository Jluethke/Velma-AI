# Service Reminder Generator

Generate service reminders for upcoming maintenance based on the schedule and average driving patterns.

## Inputs

- `schedule-status`: Current maintenance schedule status
- `next-services`: Services due at the next interval

## Outputs

- `reminder-list`: List of reminders with target date, mileage threshold, and service description
- `reminder-messages`: Formatted messages ready to send to the customer

## Process

1. Estimate the date the vehicle will reach the next mileage interval based on driving history.
2. Generate a reminder for each upcoming service with the target date and mileage.
3. Format the reminder message for the customer with the recommended services and pricing.
4. Queue the reminders for the appropriate send date.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
