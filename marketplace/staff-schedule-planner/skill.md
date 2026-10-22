# Staff Schedule Planner

Plan and manage staff schedules including shifts, time off, and coverage for peak periods.

## Inputs

- `provider-service-matrix`: Provider skills and service assignments
- `booking-configuration`: Working hours and booking rules

## Outputs

- `staff-schedule`: Weekly staff schedule with shifts, breaks, and coverage assignments
- `coverage-gaps`: Identified gaps where demand may exceed provider availability

## Process

1. Set the baseline schedule for each provider (days, start/end times, breaks).
2. Identify peak demand periods from booking history or industry norms.
3. Ensure minimum coverage for each service category during all open hours.
4. Handle time-off requests and create the contingency plan for call-outs.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
