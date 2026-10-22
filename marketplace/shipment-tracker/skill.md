# Shipment Tracker

Track the shipment from pickup to delivery.

## Inputs

- `booking-confirmation`: Booking confirmation
- `rate-confirmation-doc`: Rate confirmation document

## Outputs

- `tracking-updates`: Location and status updates throughout transit
- `exception-log`: Any exceptions (delays, damage, reroutes) logged during transit

## Process

1. Confirm pickup with the carrier (driver name, truck number, pickup time).
2. Set check-call schedule for in-transit updates.
3. Relay status updates to the shipper.
4. Log and manage any exceptions (delays, breakdowns, weather).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
