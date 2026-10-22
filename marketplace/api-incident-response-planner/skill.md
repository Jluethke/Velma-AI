# Api Incident Response Planner

Plan the incident response process for API outages.

## Inputs

- `alert-rules`: The alert configuration
- `runbook-stubs`: The runbook stubs

## Outputs

- `incident-response-plan`: The incident response plan: roles, communication, escalation, postmortem
- `api-monitoring-plan`: The complete API monitoring plan covering metrics, dashboards, alerts, and incident response

## Process

1. Define the incident roles: incident commander, communications lead, technical lead.
2. Define the communication plan: status page updates, consumer notification, internal updates.
3. Define the escalation path: when to escalate from on-call to team lead to engineering leadership.
4. Define the postmortem process: timeline, root cause analysis, action items, follow-up.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
