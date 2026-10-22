# Cleaning Supply Tracker

Track and manage cleaning supplies and equipment across crews.

## Inputs

- `crew-schedule`: Crew assignments and job types
- `service-packages`: Products and supplies required per package type

## Outputs

- `supply-inventory`: Current supply levels per crew vehicle with reorder triggers
- `equipment-log`: Equipment condition, maintenance schedule, and replacement timeline

## Process

1. List the supplies and equipment each crew needs per job type.
2. Set par levels for each crew vehicle and the central supply closet.
3. Track consumption per job to identify waste or theft.
4. Schedule equipment maintenance and replacement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
