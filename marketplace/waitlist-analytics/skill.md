# Waitlist Analytics

Track waitlist performance metrics and conversion rates.

## Inputs

- `slot-filled`: Slot filling outcomes
- `waitlist-updated`: Current waitlist state

## Outputs

- `waitlist-metrics`: Conversion rate, average wait time, abandonment rate, fill rate by service type
- `waitlist-management-record`: Complete waitlist management report

## Process

1. Calculate the conversion rate (waitlisted customers who ultimately booked divided by total waitlisted).
2. Calculate the average wait time from joining the waitlist to booking or abandoning.
3. Track abandonment rate (customers who removed themselves or expired without booking).
4. Identify services or time slots with chronic waitlists (candidates for adding capacity).
5. Compile the waitlist management report with metrics and recommendations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
