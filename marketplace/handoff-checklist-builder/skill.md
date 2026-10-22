# Handoff Checklist Builder

Build the handoff checklist that outgoing on-call completes before transferring to the next person.

## Inputs

- `rotation-schedule`: The on-call rotation schedule
- `coverage-gaps`: Coverage gaps and backup assignments

## Outputs

- `handoff-checklist`: Checklist of items to cover during handoff (open incidents, known issues, upcoming changes)
- `handoff-template`: Template document for recording each handoff

## Process

1. List the mandatory handoff items: open incidents and their status, known issues being monitored, upcoming deployments or changes, any pending customer escalations.
2. Define the format (async written handoff in Slack or wiki, or synchronous 15-minute call).
3. Create the handoff template with fields for each item.
4. Set the deadline for completing the handoff (at least 1 hour before rotation ends).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
