# Irrigation Schedule Builder

Build the irrigation schedule with timing, duration, and method for each zone.

## Inputs

- `water-requirements`: Water needs by zone
- `delivery-capacity`: System delivery rates
- `deficit-zones`: Priority zones

## Outputs

- `irrigation-schedule`: Run times by zone, day, and duration
- `water-usage-forecast`: Projected water usage for the scheduling period

## Process

1. Prioritize deficit zones for immediate irrigation.
2. Calculate run times from application rate and requirement.
3. Sequence zones to stay within pump capacity.
4. Produce the schedule with start times, durations, and volumes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
