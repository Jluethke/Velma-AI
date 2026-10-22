# Transit Vehicle Scheduler

Assign vehicles to runs based on the service plan.

## Inputs

- `route-network`: Route map
- `service-standards`: Service frequency and capacity targets

## Outputs

- `vehicle-blocks`: Vehicle assignments (which bus covers which runs throughout the day)
- `fleet-requirement`: Total vehicles needed (peak, spare ratio)

## Process

1. Build the timetable with departure times for each route and direction.
2. Chain trips into vehicle blocks that minimize deadhead (non-revenue) time.
3. Calculate the peak vehicle requirement and add the spare ratio.
4. Assign vehicle types based on route demand and road constraints.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
