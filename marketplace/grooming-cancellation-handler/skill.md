# Grooming Cancellation Handler

Handle no-shows, cancellations, and schedule changes to minimize revenue loss.

## Inputs

- `daily-route`: Current day's schedule
- `capacity-report`: Available slots and waitlist

## Outputs

- `updated-schedule`: Adjusted schedule with filled gaps or early finish
- `grooming-operations-plan`: Complete mobile grooming operations plan

## Process

1. Apply the cancellation policy (fee, grace period) based on notice given.
2. Attempt to fill the gap from the waitlist or by pulling forward a later appointment.
3. Record the cancellation reason for pattern analysis.
4. Adjust the route if the cancellation changes the optimal sequence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
