# Grooming Route Builder

Build efficient daily routes for the mobile grooming unit.

## Inputs

- `client-pet-records`: Client locations and appointment bookings
- `time-estimates`: Service durations per appointment

## Outputs

- `daily-route`: Optimized daily route with appointment times, addresses, and pet details
- `capacity-report`: Daily capacity utilization and available slots

## Process

1. Group appointments by geographic area to minimize drive time.
2. Sequence appointments with realistic travel and setup buffers.
3. Limit daily appointments to vehicle water and supply capacity.
4. Identify open slots and suggest them for waitlisted clients.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
