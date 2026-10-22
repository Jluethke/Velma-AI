# Escalation Trigger Configuration

Define what triggers an escalation from one tier to the next.

## Inputs

- `tier-definitions`: Escalation tiers with roles
- `response-time-targets`: Response time targets per tier

## Outputs

- `trigger-rules`: Rules that trigger escalation (time-based, severity-based, customer-impact-based)
- `notification-methods`: How each tier is notified during escalation (page, call, Slack, email)

## Process

1. Define time-based triggers: if L1 has not acknowledged in X minutes, escalate to L2.
2. Define severity-based triggers: critical incidents skip L1 and go directly to L2.
3. Define customer-impact triggers: if more than N customers are affected, escalate to management immediately.
4. Map each trigger to the notification method for the receiving tier.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
