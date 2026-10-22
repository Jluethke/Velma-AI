# Maintenance Schedule Tracker

Track the manufacturer maintenance schedule for a vehicle and flag overdue or upcoming items.

## Inputs

- `updated-history`: Current vehicle service history
- `vehicle-identifier`: VIN to look up the manufacturer schedule

## Outputs

- `schedule-status`: Each maintenance item with its status (current, due soon, overdue)
- `next-services`: List of services due at the next interval based on current mileage

## Process

1. Look up the manufacturer maintenance schedule for the vehicle year, make, and model.
2. Compare the service history against the schedule to identify completed, due, and overdue items.
3. Calculate the next service interval based on the current mileage and time.
4. Flag any overdue items for priority attention.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
