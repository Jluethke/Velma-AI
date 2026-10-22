# Bottleneck Identifier Ranker

Identify the bottlenecks in the onboarding process and rank them by delay caused. A bottleneck is anything that prevents the new hire from progressing to the next step. Common bottlenecks: waiting for system access (IT), waiting for equipment, no documentation for critical processes, no assigned buddy or mentor, unclear first assignment.

## Inputs

- `process-map`: The day-by-day onboarding map with delays annotated
- `new-hire-feedback`: Direct quotes about what slowed things down

## Outputs

- `ranked-bottlenecks`: Every bottleneck in the onboarding process, ranked by the delay it causes (in days or weeks of lost productivity)
- `bottleneck-owners`: Who controls each bottleneck (IT, HR, the hiring manager, the team) and their current SLA or response time

## Process

1. From the process map, list every waiting period and gap. For each, estimate the delay in working days.
2. Classify each bottleneck: access (IT), equipment (facilities/procurement), knowledge (documentation/training), direction (manager/team), or social (no buddy/mentor).
3. Identify who controls each bottleneck. Access delays are IT's problem. Knowledge delays are the team's problem. Direction delays are the manager's problem.
4. Rank by delay caused. The bottleneck that costs the most days is the highest priority to fix.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
