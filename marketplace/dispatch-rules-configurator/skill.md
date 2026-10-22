# Dispatch Rules Configurator

Configure the dispatch rules for job assignment.

## Inputs

- `zone-map`: Dispatch zone map
- `zone-profiles`: Zone profiles

## Outputs

- `dispatch-rules`: Rules for assigning jobs (priority, proximity, skill match, load balancing)
- `escalation-rules`: Rules for escalating unassigned or overdue jobs

## Process

1. Define priority levels for job types (emergency, urgent, scheduled, routine).
2. Set assignment rules: assign to the nearest available crew with the required skill.
3. Configure load balancing to prevent overloading any single crew.
4. Set escalation triggers for jobs not assigned within the target time.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
