# Panel Session Scheduler

Schedule research sessions by matching study requirements to available panel members.

## Inputs

- `panel-registry`: The active panel registry
- `research-agenda`: The upcoming research topics and their participant requirements

## Outputs

- `session-schedule`: Scheduled sessions with confirmed participants and logistics
- `invitation-metrics`: Invitation acceptance rate by segment

## Process

1. Match the study's participant criteria to eligible panel members.
2. Apply fatigue rules (minimum days between invitations, maximum sessions per quarter).
3. Send invitations with session details, incentive, and scheduling options.
4. Confirm participants and send calendar holds and preparation materials.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
