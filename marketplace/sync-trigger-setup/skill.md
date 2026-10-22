# Sync Trigger Setup

Configure when the sync runs: on a schedule, on change detection, or manually.

## Inputs

- `sync-direction`: The chosen sync direction and source of truth
- `field-mapping`: The column-to-field mapping

## Outputs

- `trigger-configuration`: Trigger type, schedule or event definition, and retry policy
- `sync-frequency`: How often the sync runs under normal conditions

## Process

1. Assess how frequently the source data changes and how quickly the target needs to reflect it.
2. Choose the trigger type: scheduled (cron), event-driven (on row change or webhook), or manual.
3. Define the retry policy for failed syncs.
4. Document the trigger configuration and expected sync frequency.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
