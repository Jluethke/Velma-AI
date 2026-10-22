# Runbook Escalation Definer

Add escalation criteria to each runbook defining when and how to escalate beyond the on-call responder.

## Inputs

- `draft-runbooks`: Draft runbooks with procedures
- `escalation-contacts`: Contact information for escalation targets

## Outputs

- `runbooks-with-escalation`: Runbooks updated with escalation criteria
- `escalation-matrix`: Matrix of who to escalate to for each scenario

## Process

1. Define the criteria for escalation (time elapsed, severity, scope)
2. Document the escalation path for each runbook scenario
3. Include contact information and preferred communication channels
4. Add the escalation criteria to each runbook

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
