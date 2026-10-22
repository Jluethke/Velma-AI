# Resource Utilization Tracking

Track resource utilization to inform future capacity decisions.

## Inputs

- `booking-interface`: The booking interface in production
- `conflict-detection-config`: Conflict and waitlist configuration

## Outputs

- `utilization-dashboard`: Dashboard showing booking rates, no-show rates, peak times, and underused resources
- `resource-booking-document`: Complete resource booking system setup document

## Process

1. Track booking rate per resource (percentage of available hours booked).
2. Track no-show and cancellation rates per resource.
3. Identify peak demand times and resources with frequent waitlists (candidates for adding capacity).
4. Identify underused resources (candidates for repurposing or removing from the system).
5. Compile the complete resource booking system document: catalog, rules, interface, and utilization baseline.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
