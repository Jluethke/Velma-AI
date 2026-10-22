# Escalation Trigger Inventory

Define what triggers an escalation. Be specific: not 'when things go wrong' but 'when a customer-facing system is down for more than 15 minutes' or 'when a complaint mentions legal action.'

## Inputs

- `system-or-org-description`: The system, team, or organization the escalation path serves
- `historical-incidents`: Past incidents that should have triggered escalation (whether or not they did)

## Outputs

- `trigger-catalog`: List of specific, measurable escalation triggers with thresholds
- `severity-levels`: Severity tiers (typically 3-5) with clear criteria for each

## Process

1. List every incident from the past year that required someone above the front line to get involved. These are your historical triggers.
2. For each incident, define the measurable condition that should have triggered escalation: a time threshold, a count threshold, a keyword, or a severity rating.
3. Group triggers into severity levels. Level 1 is business-threatening (data breach, system-wide outage, safety incident). Level 3 is important but not urgent (delayed shipment, moderate customer complaint).
4. For each severity level, define the response time: Level 1 within 15 minutes, Level 2 within 1 hour, Level 3 within 4 hours. These are targets, not promises.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
