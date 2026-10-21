# Alert Escalation Router

Route the alert to the appropriate team for escalation or close it with documentation.

## Inputs

- `severity-assessment`: Final severity rating with justification
- `scope-assessment`: Affected systems, users, and data types

## Outputs

- `escalation-decision`: Decision to escalate, contain, or close with routing details
- `notification-list`: List of teams and individuals to notify

## Process

1. Apply the escalation matrix to determine the required response level
2. Identify the responsible team (tier 2 analyst, incident response, management) based on severity and type
3. Prepare the notification with a summary of findings, severity, and recommended next steps

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
