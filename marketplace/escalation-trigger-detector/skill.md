# Escalation Trigger Detector

Detect tickets that meet escalation criteria.

## Inputs

- `ticket-queue`: Active tickets with status and history
- `escalation-policy`: Triggers for escalation (SLA breach, sentiment, repeat contact)

## Outputs

- `escalation-candidates`: Tickets meeting escalation criteria
- `trigger-reasons`: Why each ticket was flagged for escalation

## Process

1. Scan active tickets for SLA breach or approaching breach.
2. Analyze customer sentiment in recent messages.
3. Identify repeat contacts on the same issue.
4. Flag tickets meeting any escalation trigger.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
