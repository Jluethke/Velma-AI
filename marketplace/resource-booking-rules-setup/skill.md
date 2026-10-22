# Resource Booking Rules Setup

Configure the booking rules and access permissions for shared resources.

## Inputs

- `resource-catalog`: The catalog of bookable resources
- `resource-rules`: Per-resource booking rules

## Outputs

- `access-permissions`: Who can book which resources, with any approval chains
- `booking-policies`: Policies for cancellation, no-show, recurring bookings, and priority/override

## Process

1. Define who can book each resource (all staff, specific departments, requires manager approval).
2. Set the cancellation policy (free up to X hours before, auto-release if not checked in within 15 minutes).
3. Define recurring booking rules (allowed or not, max weeks ahead, auto-renewal).
4. Set priority rules for conflicts (first come first served, department priority, seniority).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
