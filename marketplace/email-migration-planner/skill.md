# Email Migration Planner

Plan the migration sequence and timeline.

## Inputs

- `migration-inventory`: What needs to migrate
- `risk-assessment`: The identified risks

## Outputs

- `migration-plan`: Step-by-step migration plan with sequence, timeline, and rollback checkpoints
- `warmup-plan`: IP and domain warm-up plan for the new provider

## Process

1. Plan the migration sequence: DNS first, then lists, then templates, then automations, then active campaigns.
2. Design the IP warm-up schedule (start with most engaged segment, gradually increase volume over 2 to 4 weeks).
3. Set rollback checkpoints at each phase (if deliverability drops below X%, pause and investigate).
4. Schedule the cutover window with a parallel sending period for validation.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
