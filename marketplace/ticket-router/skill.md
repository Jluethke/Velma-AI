# Ticket Router

Route tickets to the correct team or support tier.

## Inputs

- `scored-tickets`: Tickets with category and severity
- `routing-rules`: Rules mapping categories and severities to teams

## Outputs

- `routed-tickets`: Tickets assigned to teams with SLA timers
- `routing-exceptions`: Tickets that could not be auto-routed

## Process

1. Apply routing rules based on category, severity, and customer tier.
2. Set SLA response and resolution timers per the SLA policy.
3. Assign to the team queue with the shortest wait time.
4. Log routing exceptions for manual assignment.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
