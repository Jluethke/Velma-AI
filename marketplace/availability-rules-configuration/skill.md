# Availability Rules Configuration

Configure the availability rules that control when appointments can be booked.

## Inputs

- `service-catalog`: The catalog of bookable services
- `service-constraints`: Constraints per service

## Outputs

- `availability-rules`: Complete set of availability rules (hours, breaks, buffer, lead time, blackout dates)
- `provider-schedules`: Per-provider weekly schedule templates

## Process

1. Define the business hours for each day of the week, including any seasonal variations.
2. Set buffer time between appointments (travel time, cleanup, transition).
3. Configure minimum and maximum lead time for bookings (e.g., at least 2 hours ahead, no more than 90 days out).
4. Define blackout dates (holidays, closures) and recurring breaks (lunch, admin blocks).
5. For multi-provider setups, build a per-provider weekly schedule template.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
