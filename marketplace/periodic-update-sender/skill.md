# Periodic Update Sender

Send periodic updates at the defined cadence throughout the incident.

## Inputs

- `initial-notification`: The initial notification for context
- `delivery-confirmation`: Confirmation of initial delivery

## Outputs

- `update-log`: Log of all periodic updates sent during the incident
- `stakeholder-questions`: Questions or requests received from stakeholders during the incident

## Process

1. At each update interval, gather the latest status from the incident commander.
2. Draft the update: what has changed, what the team is doing now, what the estimated time to resolution is.
3. Send the update to all channels and confirm delivery.
4. Log the update and note any stakeholder questions that need follow-up.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
