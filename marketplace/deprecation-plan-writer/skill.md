# Deprecation Plan Writer

Write the deprecation plan with timeline and migration path.

## Inputs

- `deprecation-candidates`: Endpoints to deprecate with impact data
- `affected-consumers`: Who is affected and how to reach them

## Outputs

- `deprecation-timeline`: Schedule: announcement, sunset warning, removal date
- `migration-guide`: How consumers should migrate to the replacement endpoint or approach

## Process

1. Set the timeline: announce deprecation (day 0), add deprecation headers (day 0), sunset warning period, removal date.
2. Write the migration guide: what to use instead, how to update calls, code examples.
3. Plan the communication: changelog entry, email to affected consumers, documentation update.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
