# Gap Owner Assigner

Assign an accountable owner to each compliance gap based on organizational structure and expertise.

## Inputs

- `effort-estimates`: Estimated effort for each gap
- `team-contacts`: Organizational structure and team leads

## Outputs

- `ownership-assignments`: Each gap assigned to an accountable owner
- `capacity-conflicts`: Teams or individuals overloaded with gap remediation

## Process

1. Match each gap to the team that owns the relevant system or process
2. Assign a single accountable owner (not just a team) for each gap
3. Check for capacity conflicts where one team has too many critical gaps
4. Escalate capacity conflicts to management for resource allocation decisions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
