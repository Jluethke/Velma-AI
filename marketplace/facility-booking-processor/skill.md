# Facility Booking Processor

Process facility booking requests from inquiry through confirmation.

## Inputs

- `use-policies`: Facility use rules and agreements
- `fee-schedule`: Pricing by space and user type

## Outputs

- `booking-record`: Confirmed booking with date, time, space, user, fees, and signed agreement
- `booking-calendar`: Master calendar showing all reservations and availability

## Process

1. Receive the booking request: date, time, space, event type, expected attendance, and any special needs.
2. Check availability on the master calendar and confirm no conflicts with regular programming.
3. Send the use agreement and fee invoice; collect the signed agreement, payment, and deposit.
4. Confirm the booking, add it to the master calendar, and send the confirmation with access instructions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
