# Landscape Crew Scheduler

Schedule crews and equipment across jobs, balancing workload and travel time.

## Inputs

- `seasonal-calendar`: Active services by month
- `estimate-worksheet`: Confirmed jobs with labor hour estimates

## Outputs

- `crew-assignments`: Daily crew assignments with job sequence and equipment loadout
- `equipment-allocation`: Equipment assigned per crew per day

## Process

1. Assign recurring maintenance clients to fixed routes by day of week.
2. Schedule installation and one-time jobs around recurring work.
3. Allocate equipment to crews based on the day's job requirements.
4. Build in travel time and rain-day contingency plans.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
