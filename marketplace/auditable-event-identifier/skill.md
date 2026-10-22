# Auditable Event Identifier

Define which events require an audit record.

## Inputs

- `system-scope`: Systems and processes to be audited
- `compliance-requirements`: Regulatory and policy requirements for audit trails

## Outputs

- `auditable-events`: List of events that must produce an audit record
- `audit-trigger-rules`: Conditions that trigger an audit entry

## Process

1. List all user actions, system actions, and data changes in scope.
2. Map regulatory requirements to specific events.
3. Define trigger rules for each auditable event.
4. Produce the auditable events list and trigger rules.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
