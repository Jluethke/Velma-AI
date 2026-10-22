# Deprecation Executor

Execute the deprecation plan and monitor migration progress.

## Inputs

- `deprecation-timeline`: Schedule and milestones
- `migration-guide`: Consumer migration instructions

## Outputs

- `migration-tracking`: Dashboard showing consumer migration progress
- `deprecation-record`: Complete record of the deprecation for future reference

## Process

1. Add the Deprecation and Sunset response headers to the affected endpoints.
2. Send the initial communication to affected consumers.
3. Track migration progress: are consumers switching to the replacement?
4. At the removal date, verify all active consumers have migrated, then remove the endpoint.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
