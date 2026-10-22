# Volunteer Availability Collector

Collect volunteer availability and preferences for the upcoming scheduling period.

## Inputs

- `role-definitions`: The roles available and their requirements
- `staffing-requirements`: How many volunteers are needed per role

## Outputs

- `availability-matrix`: Each volunteer's available dates, preferred roles, and blackout dates
- `skill-roster`: Volunteers matched to the roles they are qualified for

## Process

1. Send the availability survey to all active volunteers with the scheduling period dates.
2. Collect each volunteer's available dates, preferred roles, and any blackout dates.
3. Match volunteers to roles based on qualifications and preferences.
4. Identify gaps where available volunteers are fewer than the minimum requirement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
