# Room Turnover Forecaster

Forecast room turnover by day to plan housekeeping labor.

## Inputs

- `reservation-data`: Current reservations with check-in and check-out dates
- `property-room-count`: Total rooms by type

## Outputs

- `turnover-forecast`: Expected departures, stayovers, and arrivals by day
- `labor-hours-needed`: Estimated labor hours by day

## Process

1. Count departures, stayovers, and arrivals per day.
2. Apply the cleaning time standard per room type and status.
3. Calculate total labor hours needed per day.
4. Identify peak days requiring extra staff.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
