# Fleet Maintenance Scheduler

Schedule preventive maintenance for the fleet based on manufacturer intervals and fleet policies.

## Inputs

- `vehicle-records`: Fleet vehicle records with current mileage and last service dates
- `fleet-account`: Fleet account with maintenance policy preferences

## Outputs

- `maintenance-schedule`: Scheduled maintenance appointments for each vehicle over the planning period
- `schedule-conflicts`: Vehicles that cannot be scheduled without impacting fleet availability

## Process

1. Determine the maintenance interval for each vehicle (mileage-based, time-based, or both).
2. Calculate the next service date for each vehicle based on usage patterns.
3. Schedule appointments to minimize fleet downtime (stagger across dates).
4. Flag any scheduling conflicts where too many vehicles would be out of service at once.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
