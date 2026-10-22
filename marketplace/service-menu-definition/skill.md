# Service Menu Definition

Define the service menu for the booking system, including service types, durations, and assigned providers.

## Inputs

- `business-type`: The type of business or practice offering appointments
- `services-list`: Draft list of services to offer for booking

## Outputs

- `service-catalog`: Finalized catalog of bookable services with name, duration, price, and assigned provider(s)
- `service-constraints`: Constraints per service (required equipment, room type, prep time, follow-up time)

## Process

1. List every distinct service the business offers, including variations (e.g., initial vs. follow-up visit).
2. For each service, record the name, default duration, price (if applicable), and which providers can perform it.
3. Note any constraints: required room type, equipment, prep or cleanup time between appointments.
4. Produce the service catalog as a structured list ready for the booking platform.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
