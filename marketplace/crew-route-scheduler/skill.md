# Crew Route Scheduler

Schedule cleaning crews and build efficient daily routes across client locations.

## Inputs

- `estimate-template`: Confirmed bookings from accepted estimates
- `service-packages`: Package durations and crew size requirements

## Outputs

- `crew-schedule`: Daily crew assignments with job sequence, times, and addresses
- `route-plan`: Optimized daily routes minimizing travel time between jobs

## Process

1. Assign each confirmed job to a crew based on skills, equipment, and availability.
2. Sequence the jobs to minimize drive time between locations.
3. Build in buffer time for overruns and travel delays.
4. Distribute the workload evenly across crews.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
