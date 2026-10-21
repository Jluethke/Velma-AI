# Remediation Owner Assigner

Assign remediation owners and deadlines for prioritized vulnerabilities.

## Inputs

- `prioritized-vulns`: Ranked vulnerability list with risk scores
- `priority-methodology`: Prioritization criteria

## Outputs

- `remediation-assignments`: Each vulnerability assigned to an owner with a deadline based on severity
- `remediation-tickets`: Tickets created in the tracking system for each assignment

## Process

1. Map each vulnerability to the responsible team based on asset ownership
2. Set remediation deadlines by severity: critical 7 days, high 30 days, medium 90 days, low 180 days
3. Create tracking tickets with vulnerability details, remediation guidance, and deadline

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
