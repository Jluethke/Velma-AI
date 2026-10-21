# Vehicle Service Schedule

Build a maintenance schedule based on vehicle make, model, year, and driving conditions.

## Inputs

- `vehicle_info`: Year, make, model, mileage
- `driving_conditions`: Highway, city, dusty, towing, etc.
- `current_mileage`: Current odometer reading

## Outputs

- `service_schedule`: Next 12 months of scheduled maintenance
- `severe_schedule_items`: Additional items for severe conditions
- `upcoming_milestones`: Major service milestones approaching

## Process

1. Look up manufacturer maintenance schedule
2. Adjust intervals for driving conditions
3. Calculate upcoming service dates from current mileage
4. Flag major milestones (timing belt, transmission, brakes)
5. Build 12-month service calendar

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
