# Escalation Rule Builder

Configure escalation rules for unacknowledged alerts.

## Inputs

- `channel-map`: Alert category to channel mapping
- `recipient-roster`: Recipients per channel and category

## Outputs

- `escalation-rules`: Rules defining when and how to escalate unacknowledged alerts
- `escalation-contacts`: Ordered list of escalation contacts for each tier

## Process

1. Define the acknowledgment window for each severity level (critical: 5 minutes, warning: 30 minutes, informational: none).
2. Set the escalation path: if no acknowledgment within the window, notify the next tier.
3. Define three tiers of escalation (primary responder, team lead, management).
4. Document the override rules for after-hours and weekends.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
