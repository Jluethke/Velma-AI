# Booking Rules Configurator

Define the booking rules including advance notice, duration limits, priority groups, and pricing.

## Inputs

- `space-catalog`: Available spaces and their attributes
- `availability-windows`: When spaces are available

## Outputs

- `booking-rules`: Complete ruleset (advance booking window, max duration, cancellation policy, priority tiers)
- `pricing-schedule`: Rates by space type, time slot, and user group

## Process

1. Set the advance booking window (how far ahead bookings can be made).
2. Define maximum and minimum booking durations.
3. Establish priority groups (residents, members, league play, public) and their booking windows.
4. Set the pricing and cancellation/refund policy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
